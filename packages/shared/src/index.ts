// Shared types and utilities for EaseRead
// Add your shared types, interfaces, and utility functions here

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

// Example shared utility
export const formatDate = (date: Date): string => {
  return date.toISOString();
};
