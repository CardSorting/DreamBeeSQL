/**
 * Enhanced error class with context-aware information
 */
export class NoormError extends Error {
  constructor(
    message: string,
    public context: {
      table?: string;
      operation?: string;
      suggestion?: string;
      availableOptions?: string[];
      originalError?: Error;
    } = {}
  ) {
    super(message);
    this.name = 'NoormError';

    // Maintain stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NoormError);
    }
  }

  /**
   * Get a formatted error message with context
   */
  getFormattedMessage(): string {
    let formatted = this.message;

    if (this.context.table) {
      formatted += `\n  Table: ${this.context.table}`;
    }

    if (this.context.operation) {
      formatted += `\n  Operation: ${this.context.operation}`;
    }

    if (this.context.suggestion) {
      formatted += `\n  Suggestion: ${this.context.suggestion}`;
    }

    if (this.context.availableOptions && this.context.availableOptions.length > 0) {
      formatted += `\n  Available options: ${this.context.availableOptions.join(', ')}`;
    }

    if (this.context.originalError) {
      formatted += `\n  Original error: ${this.context.originalError.message}`;
    }

    return formatted;
  }

  /**
   * Convert to JSON for logging/debugging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Specific error types for common scenarios
 */
export class TableNotFoundError extends NoormError {
  constructor(tableName: string, availableTables: string[] = []) {
    super(
      `Table '${tableName}' not found`,
      {
        table: tableName,
        operation: 'table_lookup',
        suggestion: availableTables.length > 0 
          ? `Available tables: ${availableTables.join(', ')}`
          : 'Check your table name or run schema discovery',
        availableOptions: availableTables
      }
    )
    this.name = 'TableNotFoundError'
  }
}

export class ColumnNotFoundError extends NoormError {
  constructor(columnName: string, tableName: string, availableColumns: string[] = []) {
    super(
      `Column '${columnName}' not found in table '${tableName}'`,
      {
        table: tableName,
        operation: 'column_lookup',
        suggestion: availableColumns.length > 0 
          ? `Available columns: ${availableColumns.join(', ')}`
          : 'Check your column name or run schema discovery',
        availableOptions: availableColumns
      }
    )
    this.name = 'ColumnNotFoundError'
  }
}

export class ConnectionError extends NoormError {
  constructor(message: string, originalError?: Error) {
    super(
      message,
      {
        operation: 'connection',
        suggestion: 'Check your database connection settings and ensure the database server is running',
        originalError
      }
    )
    this.name = 'ConnectionError'
  }
}

export class DatabaseInitializationError extends NoormError {
  constructor(originalError: Error, databasePath: string) {
    super(
      `Failed to initialize database at ${databasePath}: ${originalError.message}`,
      {
        operation: 'initialization',
        suggestion: 'Check database permissions, path validity, and connection settings',
        originalError
      }
    )
    this.name = 'DatabaseInitializationError'
  }
}

export class ValidationError extends NoormError {
  constructor(message: string, validationIssues: string[] = []) {
    super(
      message,
      {
        operation: 'validation',
        suggestion: 'Check your input data and ensure it matches the expected schema',
        availableOptions: validationIssues
      }
    )
    this.name = 'ValidationError'
  }
}

export class RelationshipNotFoundError extends NoormError {
  constructor(relationshipName: string, tableName: string, availableRelationships: string[] = []) {
    super(
      `Relationship '${relationshipName}' not found on table '${tableName}'`,
      {
        table: tableName,
        operation: 'relationship_lookup',
        suggestion: availableRelationships.length > 0
          ? `Available relationships: ${availableRelationships.join(', ')}`
          : 'No relationships defined for this table',
        availableOptions: availableRelationships
      }
    )
    this.name = 'RelationshipNotFoundError'
  }
}

/**
 * Helper function to find similar column names using simple string similarity
 */
function findSimilarColumns(columns: string[], target: string): string[] {
  const lowerTarget = target.toLowerCase();

  // First, try exact case-insensitive match
  const exactMatch = columns.find(col => col.toLowerCase() === lowerTarget);
  if (exactMatch) return [exactMatch];

  // Then try substring matches
  const substringMatches = columns.filter(col =>
    col.toLowerCase().includes(lowerTarget) || lowerTarget.includes(col.toLowerCase())
  );

  if (substringMatches.length > 0) {
    return substringMatches.slice(0, 3); // Return up to 3 matches
  }

  // Finally, try simple Levenshtein-like similarity
  const similarities = columns.map(col => ({
    name: col,
    score: calculateSimilarity(lowerTarget, col.toLowerCase())
  }));

  return similarities
    .filter(s => s.score > 0.5) // Only return if similarity > 50%
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.name);
}

/**
 * Simple similarity calculation (Dice coefficient)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;

  const bigrams1 = getBigrams(str1);
  const bigrams2 = getBigrams(str2);

  const intersection = bigrams1.filter(bigram => bigrams2.includes(bigram));

  return (2 * intersection.length) / (bigrams1.length + bigrams2.length);
}

function getBigrams(str: string): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2));
  }
  return bigrams;
}