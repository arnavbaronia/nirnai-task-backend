import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  buyer: varchar('buyer', { length: 255 }),
  seller: varchar('seller', { length: 255 }),
  houseNumber: varchar('house_number', { length: 100 }),
  surveyNumber: varchar('survey_number', { length: 100 }),
  documentNumber: varchar('document_number', { length: 100 }),
  value: varchar('value', { length: 100 }),
  date: timestamp('date'),
});