import { pgTable, serial, text, timestamp, numeric } from 'drizzle-orm/pg-core';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  serialNumber: text('serial_number'),
  documentNumber: text('document_number'),
  documentYear: text('document_year'),
  executionDate: timestamp('execution_date'),
  presentationDate: timestamp('presentation_date'),
  registrationDate: timestamp('registration_date'),
  nature: text('nature'),
  executants: text('executants'), // sellers
  claimants: text('claimants'), // buyers
  volumeNumber: text('volume_number'),
  pageNumber: text('page_number'),
  considerationValue: numeric('consideration_value', { precision: 15, scale: 2 }),
  marketValue: numeric('market_value', { precision: 15, scale: 2 }),
  prNumber: text('pr_number'),
  propertyType: text('property_type'),
  propertyExtent: text('property_extent'),
  village: text('village'),
  street: text('street'),
  surveyNumbers: text('survey_numbers'),
  plotNumber: text('plot_number'),
  remarks: text('remarks'),
  createdAt: timestamp('created_at').defaultNow(),
});