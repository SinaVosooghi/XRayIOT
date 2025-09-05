/**
 * Shared Domain Library
 *
 * This library provides domain services and implementations
 * for the XRayIOT system, ensuring clear boundaries between
 * different domains and services.
 *
 * This library leverages the existing type system from @iotp/shared-types
 * to provide type-safe domain services with proper business logic.
 */

// Domain Module
export { DomainModule } from './domain.module';

// Domain Services
export {
  SignalsDomainService,
  SignalRepository,
  RawPayloadStore,
  SignalProcessingContext,
  SignalProcessingResult,
  SignalQuery,
  LocationBounds,
} from './services/signals.domain.service';
