# Technical Debt & Known Issues - XRayIOT

## 🚨 **Critical Issues (Must Address Before P2)**

### **TD-000: Architectural Debt (NEW)**
**Priority**: 🔴 CRITICAL  
**Status**: 🟡 Identified  
**Created**: December 2024  
**Assigned**: TBD

**Description**: Comprehensive architectural improvements needed based on user feedback:
- Module boundaries not enforced in monorepo
- Message contracts lack versioning and idempotency
- Validation not centralized across services
- Configuration not properly typed and validated
- Domain boundaries not clearly defined
- Error handling lacks taxonomy and consistency
- No correlation ID tracking throughout system
- Storage layer not abstracted with repository pattern
- API design lacks consistency in pagination and responses
- Missing architecture documentation (ADRs)

**Impact**:
- Poor code maintainability and scalability
- Difficult to prevent breaking changes
- Inconsistent data validation across services
- Configuration errors at runtime
- Tight coupling between modules
- Poor debugging and observability
- Difficult to swap persistence layers
- Inconsistent developer experience
- Lack of architectural decision history

**Resolution Required**:
- Enforce module boundaries with ESLint rules
- Add schema versioning and idempotency to message contracts
- Implement global ValidationPipe with shared DTOs
- Create typed configuration module with validation
- Define explicit interfaces for bounded contexts
- Create error taxonomy with exception filters
- Implement correlation ID propagation
- Create storage abstraction with repository pattern
- Standardize API design and responses
- Create ADRs and sequence diagrams

**Effort Estimate**: 10-15 days  
**Dependencies**: None  
**Blockers**: None

---

### **TD-001: Domain Mismatch**
**Priority**: 🔴 CRITICAL  
**Status**: 🟡 Identified  
**Created**: November 2024  
**Assigned**: TBD

**Description**: Project is called "XRayIOT" but actually processes GPS/telemetry data (latitude, longitude, speed) rather than X-ray data.

**Impact**:
- Confusion in codebase naming and documentation
- Misleading API endpoints and data models
- Potential user confusion about system purpose
- Inconsistent with actual data being processed

**Root Cause**: Initial project name based on requirements document that mentioned "x-ray data" but sample data shows GPS/telemetry coordinates.

**Resolution Options**:
1. **Rename Project**: Change to "TelemetryIOT" or "GPSTracker"
2. **Update Documentation**: Clarify that it processes telemetry data
3. **Hybrid Approach**: Keep XRayIOT name but clarify telemetry processing

**Effort Estimate**: 2-3 days  
**Dependencies**: None  
**Blockers**: None

---

### **TD-002: Messaging Contract Underspecification**
**Priority**: 🔴 CRITICAL  
**Status**: 🟡 Identified  
**Created**: November 2024  
**Assigned**: TBD

**Description**: RabbitMQ messaging contract is underspecified with missing:
- Exchange type specification
- Routing key patterns
- QoS settings and prefetch counts
- Message schema versioning
- Idempotency key handling

**Impact**:
- Inconsistent message handling
- Difficult to scale or modify message patterns
- Potential message loss or duplication
- Integration challenges with external systems

**Current State**:
```yaml
RABBITMQ_EXCHANGE: iot.xray
RABBITMQ_QUEUE: xray.raw.q
RABBITMQ_DLX: iot.dlx
```

**Required Specifications**:
- Exchange type: `topic` or `direct`
- Routing key pattern: `iot.xray.raw.{deviceId}`
- QoS: prefetch=50, ack=manual
- Schema version: `v1.0`
- Idempotency: Required header

**Effort Estimate**: 1-2 days  
**Dependencies**: TD-001 (Domain Mismatch)  
**Blockers**: None

---

### **TD-003: API Specification Gaps**
**Priority**: 🔴 CRITICAL  
**Status**: 🟡 Identified  
**Created**: November 2024  
**Assigned**: TBD

**Description**: API specification missing:
- Pagination parameters and response format
- Sorting options and field specifications
- Security requirements and error codes
- Rate limiting details
- Request/response schema validation

**Impact**:
- Inconsistent API behavior
- Poor developer experience
- Security vulnerabilities
- Integration difficulties

**Current API Endpoints**:
```bash
GET    /api/signals              # Missing pagination
GET    /api/signals/:id          # Missing error codes
POST   /api/signals              # Missing validation
PATCH  /api/signals/:id          # Missing update rules
DELETE /api/signals/:id          # Missing soft delete
```

**Required Specifications**:
- Pagination: `?page=1&limit=20&sort=createdAt&order=desc`
- Error Codes: 400, 401, 403, 404, 429, 500
- Rate Limiting: 600 RPM per API key
- Validation: JSON Schema for all requests

**Effort Estimate**: 2-3 days  
**Dependencies**: TD-001 (Domain Mismatch)  
**Blockers**: None

---

### **TD-004: Data Model Clarity Issues**
**Priority**: 🟡 HIGH  
**Status**: 🟡 Identified  
**Created**: November 2024  
**Assigned**: TBD

**Description**: Unclear time field interpretation and data model inconsistencies:
- Time fields: Both epoch and relative time in data points
- Data structure: Inconsistent array vs object patterns
- Field naming: Inconsistent naming conventions
- Validation: Missing data validation rules

**Impact**:
- Data processing errors
- Inconsistent API responses
- Difficult data analysis
- Integration challenges

**Current Data Structure**:
```json
{
  "deviceId": "66bb584d4ae73e488c30a072",
  "data": [
    [762, [51.339764, 12.339223833333334, 1.2038000000000002]],
    [1766, [51.33977733333333, 12.339211833333334, 1.531604]]
  ],
  "time": 1735683480000
}
```

**Issues**:
- `time` field: Epoch timestamp (1735683480000)
- `data[0][0]`: Relative time (762, 1766)
- Unclear which time is authoritative
- Missing timezone information

**Resolution Required**:
- Define authoritative time field
- Clarify time units (milliseconds, seconds)
- Add timezone information
- Standardize data structure

**Effort Estimate**: 1-2 days  
**Dependencies**: TD-001 (Domain Mismatch)  
**Blockers**: None

---

### **TD-005: Sample Data Issues**
**Priority**: 🟡 HIGH  
**Status**: 🟡 Identified  
**Created**: November 2024  
**Assigned**: TBD

**Description**: Sample data problems:
- Broken Google Drive link in Task.md
- Existing x-ray.json file not referenced
- Inconsistent data formats
- Missing data validation examples

**Impact**:
- Difficult onboarding for new developers
- Inconsistent testing data
- Poor documentation quality
- Integration testing challenges

**Current Issues**:
- Google Drive link: `https:/ /drive.google.com/file/d/1NTxLA_5OYx2kSnPlXkwQ2AzcLBxRlkTr/view?usp=sha ring`
- Local file: `x-ray.json` exists but not documented
- Format mismatch between Task.md and actual data

**Resolution Required**:
- Fix Google Drive link
- Document local sample data file
- Create consistent data format
- Add data validation examples

**Effort Estimate**: 0.5 days  
**Dependencies**: None  
**Blockers**: None

---

## 🟡 **High Priority Issues**

### **TD-006: Test Coverage Gaps**
**Priority**: 🟡 HIGH  
**Status**: 🟡 In Progress  
**Created**: December 2024  
**Assigned**: TBD

**Description**: Core business logic not fully tested:
- Current coverage: ~85%
- Target coverage: >90%
- Missing edge cases
- Incomplete error scenario testing

**Impact**:
- Potential production bugs
- Difficult refactoring
- Poor code quality
- Maintenance challenges

**Areas Needing Coverage**:
- Message validation logic
- Error handling scenarios
- Edge cases in data processing
- Integration failure scenarios

**Effort Estimate**: 3-4 days  
**Dependencies**: None  
**Blockers**: None

---

### **TD-007: Performance Optimization Needed**
**Priority**: 🟡 HIGH  
**Status**: 🟡 Identified  
**Created**: December 2024  
**Assigned**: TBD

**Description**: Overall system performance needs improvement:
- API response times: Target <200ms, current ~300ms
- Message processing: Target <100ms, current ~150ms
- Database queries: Target <50ms, current ~80ms
- Memory usage: Target <512MB, current ~800MB

**Impact**:
- Poor user experience
- High infrastructure costs
- Scalability limitations
- Resource inefficiency

**Optimization Areas**:
- Database query optimization
- Message processing efficiency
- Memory usage reduction
- Caching strategies

**Effort Estimate**: 5-7 days  
**Dependencies**: TD-006 (Test Coverage)  
**Blockers**: None

---

## 🟢 **Medium Priority Issues**

### **TD-008: Documentation Inconsistencies**
**Priority**: 🟢 MEDIUM  
**Status**: 🟡 Identified  
**Created**: December 2024  
**Assigned**: TBD

**Description**: Documentation inconsistencies across the project:
- Inconsistent terminology
- Outdated information
- Missing examples
- Poor structure

**Impact**:
- Developer confusion
- Onboarding difficulties
- Maintenance overhead
- Poor user experience

**Effort Estimate**: 2-3 days  
**Dependencies**: TD-001 (Domain Mismatch)  
**Blockers**: None

---

### **TD-009: Error Handling Improvements**
**Priority**: 🟢 MEDIUM  
**Status**: 🟡 Identified  
**Created**: December 2024  
**Assigned**: TBD

**Description**: Error handling needs improvement:
- Inconsistent error responses
- Missing error codes
- Poor error messages
- Incomplete error logging

**Impact**:
- Difficult debugging
- Poor user experience
- Maintenance challenges
- Security concerns

**Effort Estimate**: 2-3 days  
**Dependencies**: TD-003 (API Specification)  
**Blockers**: None

---

### **TD-010: Monitoring & Observability Gaps**
**Priority**: 🟢 MEDIUM  
**Status**: 🟡 Identified  
**Created**: December 2024  
**Assigned**: TBD

**Description**: Limited monitoring and observability:
- Basic health checks only
- No performance metrics
- Limited error tracking
- No alerting system

**Impact**:
- Difficult to detect issues
- Poor system visibility
- Slow incident response
- Limited insights

**Effort Estimate**: 3-4 days  
**Dependencies**: None  
**Blockers**: None

---

## 📊 **Technical Debt Summary**

### **Priority Distribution**
- 🔴 **Critical**: 5 issues (50%)
- 🟡 **High**: 2 issues (20%)
- 🟢 **Medium**: 3 issues (30%)

### **Effort Estimates**
- **Total Effort**: 20-30 days
- **Critical Issues**: 8-12 days
- **High Priority**: 8-11 days
- **Medium Priority**: 7-10 days

### **Dependencies**
- **TD-001** (Domain Mismatch) blocks: TD-002, TD-003, TD-004, TD-008
- **TD-006** (Test Coverage) blocks: TD-007
- **TD-003** (API Specification) blocks: TD-009

### **Resolution Timeline**
- **Phase 1** (Critical): 2-3 weeks
- **Phase 2** (High Priority): 2-3 weeks
- **Phase 3** (Medium Priority): 2-3 weeks

---

**Last Updated**: December 2024  
**Next Review**: January 2025  
**Status**: Active  
**Total Issues**: 10  
**Resolved**: 0  
**In Progress**: 1  
**Identified**: 9
