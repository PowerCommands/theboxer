import { BOXERS } from './boxers.js';

let currentDate = new Date(2025, 1, 5); // February 5, 2025

export function getCurrentDate() {
  return new Date(currentDate);
}

export function setCurrentDate(date) {
  if (date instanceof Date && !isNaN(date)) {
    currentDate = new Date(date);
  }
}

export function resetDate() {
  currentDate = new Date(2025, 1, 5);
}

export function advanceMonth() {
  const prevMonth = currentDate.getMonth();
  currentDate.setMonth(currentDate.getMonth() + 1, 5);
  if (currentDate.getMonth() === 0 && prevMonth === 11) {
    BOXERS.forEach((b) => {
      b.age += 1;
    });
  }
}

export function formatDate(date) {
  return date
    .toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .toLowerCase();
}
