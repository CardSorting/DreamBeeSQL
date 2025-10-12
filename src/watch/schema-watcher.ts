import type { Kysely } from '../kysely.js'
import { SchemaInfo, SchemaChange } from '../types/index.js'
import { Logger } from '../logging/logger.js'
import { SchemaDiscovery } from '../schema/schema-discovery.js'

export interface WatchOptions {
  pollInterval?: number; // in milliseconds, default 5000 (5 seconds)
  ignoreViews?: boolean;
  ignoredTables?: string[];
  enabled?: boolean;
}

/**
 * Monitors database schema changes in development mode
 */
export class SchemaWatcher {
  private isWatching = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastSchemaHash: string | null = null;
  private callbacks: Array<(changes: SchemaChange[]) => void> = [];

  constructor(
    private db: Kysely<any>,
    private schemaDiscovery: SchemaDiscovery,
    private logger: Logger,
    private options: WatchOptions = {}
  ) {
    // Merge options, giving priority to explicitly passed values
    const defaultEnabled = process.env.NODE_ENV === 'development';
    this.options = {
      pollInterval: 5000,
      ignoreViews: true,
      ignoredTables: [],
      enabled: options.enabled !== undefined ? options.enabled : defaultEnabled,
      ...options
    };
  }

  /**
   * Start watching for schema changes
   */
  async startWatching(): Promise<void> {
    if (!this.options.enabled) {
      this.logger.debug('Schema watching disabled (not in development mode)');
      return;
    }

    if (this.isWatching) {
      this.logger.warn('Schema watcher already running');
      return;
    }

    this.logger.info('Starting schema change monitoring...');

    // Get initial schema snapshot
    try {
      const initialSchema = await this.getCurrentSchema();
      this.lastSchemaHash = this.hashSchema(initialSchema);
    } catch (error) {
      this.logger.error('Failed to get initial schema snapshot:', error);
      // Set a default hash to allow watching to continue
      this.lastSchemaHash = '0';
    }

    this.isWatching = true;
    this.intervalId = setInterval(() => {
      this.checkForChanges().catch(error => {
        this.logger.error('Error checking for schema changes:', error);
      });
    }, this.options.pollInterval);

    // Unref the interval to allow the process to exit
    if (this.intervalId && typeof this.intervalId.unref === 'function') {
      this.intervalId.unref();
    }

    this.logger.info(`Schema watcher started (polling every ${this.options.pollInterval}ms)`);
  }

  /**
   * Stop watching for schema changes
   */
  stopWatching(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isWatching = false;
    this.callbacks = []; // Clear callbacks on stop
    
    if (this.logger) {
      this.logger.info('Schema watcher stopped');
    }
  }

  /**
   * Register callback for schema changes
   */
  onSchemaChange(callback: (changes: SchemaChange[]) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Remove callback for schema changes
   */
  removeSchemaChangeCallback(callback: (changes: SchemaChange[]) => void): void {
    const index = this.callbacks.indexOf(callback);
    if (index > -1) {
      this.callbacks.splice(index, 1);
    }
  }

  /**
   * Manually trigger schema check
   */
  async checkForChanges(): Promise<SchemaChange[]> {
    try {
      const currentSchema = await this.getCurrentSchema();
      const currentHash = this.hashSchema(currentSchema);

      // Debug logging
      this.logger.debug(`Schema check - Last hash: ${this.lastSchemaHash}, Current hash: ${currentHash}, Tables: ${currentSchema.tables.length}`);

      if (this.lastSchemaHash && currentHash !== this.lastSchemaHash) {
        this.logger.info('Schema changes detected, analyzing...');

        // Since we only have the hash, we'll need to do a full schema comparison
        // In a production implementation, you'd store the full previous schema
        const changes = await this.detectChanges();

        this.lastSchemaHash = currentHash;

        if (changes.length > 0) {
          this.logger.info(`Found ${changes.length} schema changes`);
          this.notifyCallbacks(changes);
        }

        return changes;
      }

      // Update hash even if no changes detected yet (for first check after initialization)
      if (!this.lastSchemaHash) {
        this.lastSchemaHash = currentHash;
      }

      return [];
    } catch (error) {
      this.logger.error('Failed to check for schema changes:', error);
      return [];
    }
  }

  /**
   * Get current database schema
   */
  private async getCurrentSchema(): Promise<SchemaInfo> {
    return await this.schemaDiscovery.discoverSchema();
  }

  /**
   * Create a hash of the schema for change detection
   */
  private hashSchema(schema: SchemaInfo): string {
    // Create a deterministic string representation of the schema
    const schemaString = JSON.stringify({
      tables: schema.tables
        .filter(table => !this.options.ignoredTables?.includes(table.name))
        .map(table => ({
          name: table.name,
          columns: table.columns.map(col => ({
            name: col.name,
            type: col.type,
            nullable: col.nullable,
            isPrimaryKey: col.isPrimaryKey,
            defaultValue: col.defaultValue
          })),
          primaryKey: table.primaryKey,
          foreignKeys: table.foreignKeys,
          indexes: table.indexes
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),

      relationships: schema.relationships
        .sort((a, b) => `${a.fromTable}.${a.name}`.localeCompare(`${b.fromTable}.${b.name}`))
    });

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < schemaString.length; i++) {
      const char = schemaString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return hash.toString();
  }

  /**
   * Detect specific changes between schemas
   */
  private async detectChanges(): Promise<SchemaChange[]> {
    // In a real implementation, you'd compare the old and new schemas
    // For now, return a generic change notification
    return [{
      type: 'table_added', // This would be determined by actual comparison
      table: 'unknown',
      details: 'Schema change detected - full refresh recommended'
    }];
  }

  /**
   * Notify all registered callbacks about schema changes
   */
  private notifyCallbacks(changes: SchemaChange[]): void {
    this.callbacks.forEach(callback => {
      try {
        callback(changes);
      } catch (error) {
        this.logger.error('Error in schema change callback:', error);
      }
    });
  }

  /**
   * Get current watching status
   */
  isCurrentlyWatching(): boolean {
    return this.isWatching;
  }

  /**
   * Get watch configuration
   */
  getWatchOptions(): WatchOptions {
    return { ...this.options };
  }
}