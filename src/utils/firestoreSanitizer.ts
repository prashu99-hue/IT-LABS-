/**
 * Cloud Firestore Data Sanitization Utility
 *
 * Cloud Firestore throws:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 * whenever an object contains a property with value `undefined`.
 *
 * This recursive utility strips all `undefined` fields from objects and arrays,
 * while safely preserving:
 * - Valid falsy values: false, 0, "", null
 * - Empty arrays: []
 * - Plain and nested objects
 * - Firestore sentinels and classes: serverTimestamp(), increment(), Timestamp, Date, etc.
 */

/**
 * Check if value is a plain JavaScript object
 */
function isPlainObject(value: any): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  // Check prototype
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Checks if value is a special Firestore type that must be preserved as-is
 * (e.g. serverTimestamp, FieldValue, Timestamp, Date)
 */
function isFirestoreSentinelOrDate(value: any): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (value instanceof Date) {
    return true;
  }
  // Check for Firestore Timestamp
  if (typeof value.toMillis === 'function' && typeof value.toDate === 'function') {
    return true;
  }
  // Check for FieldValue tokens (serverTimestamp, increment, deleteField, arrayUnion, etc.)
  if ('_methodName' in value || value.constructor?.name === 'FieldValueImpl' || value.constructor?.name === 'FieldValue') {
    return true;
  }
  return false;
}

/**
 * Recursively cleans an object or array to ensure it contains no `undefined` values.
 *
 * @param input The data payload to sanitize
 * @returns The sanitized copy of data ready for Firestore setDoc / addDoc / updateDoc
 */
export function cleanFirestoreData<T = any>(input: T): T {
  // If undefined, return undefined so caller key can be omitted
  if (input === undefined) {
    return undefined as any;
  }

  // Preserve null and all primitive values (strings, numbers, booleans, etc.)
  // (e.g., false, 0, "" are preserved)
  if (input === null || typeof input !== 'object') {
    return input;
  }

  // Preserve Firestore sentinels, Timestamps, and Dates
  if (isFirestoreSentinelOrDate(input)) {
    return input;
  }

  // Handle Arrays
  if (Array.isArray(input)) {
    const cleanedArr: any[] = [];
    for (const item of input) {
      if (item !== undefined) {
        const cleanedItem = cleanFirestoreData(item);
        if (cleanedItem !== undefined) {
          cleanedArr.push(cleanedItem);
        }
      }
    }
    return cleanedArr as any;
  }

  // If not a plain object (e.g. unknown class instance), preserve if not plain
  if (!isPlainObject(input)) {
    return input;
  }

  // Handle plain objects: reconstruct with only defined keys
  const cleanedObj: Record<string, any> = {};
  for (const key of Object.keys(input)) {
    const value = (input as Record<string, any>)[key];
    if (value !== undefined) {
      const cleanedValue = cleanFirestoreData(value);
      if (cleanedValue !== undefined) {
        cleanedObj[key] = cleanedValue;
      }
    }
  }

  return cleanedObj as any;
}
