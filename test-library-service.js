// Quick test to verify library service imports work
import { libraryService } from './src/services/libraryService.js';

console.log('Library service imported successfully:', !!libraryService);
console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(libraryService)));