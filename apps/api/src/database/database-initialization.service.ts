import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseInitializationService implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    // This creates the citext extension if it doesn't already exist
    // so that case-insensitive columns work correctly.
    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS citext');
  }
}
