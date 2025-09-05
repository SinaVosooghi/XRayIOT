/**
 * Domain Module
 *
 * This module provides domain services and implementations
 * for the XRayIOT system, ensuring clear boundaries between
 * different domains and services.
 */

import { Module } from '@nestjs/common';
import { SignalsDomainService } from './services/signals.domain.service';

@Module({
  providers: [SignalsDomainService],
  exports: [SignalsDomainService],
})
export class DomainModule {}
