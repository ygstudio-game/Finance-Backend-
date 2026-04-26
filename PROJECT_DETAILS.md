# Project Report: Zorvyn - Finance Data Processing & Access Control

| Sr. No. | Topic | Page No. |
| :--- | :--- | :--- |
| | Acknowledgement | i |
| | Contents | ii |
| | List of Tables/Collections | iii |
| | List of Forms | iv |
| | Acronyms | v |
| | Abstract | vi |
| **Chapter-1** | **Introduction** | **1** |
| 1.1 | Motivation | 1 |
| 1.2 | Problem Statement and scope | 2 |
| 1.3 | Framework of the proposed work in project | 3 |
| **Chapter-2** | **Literature Review** | **5** |
| 2.1 | Introduction | 5 |
| 2.2 | Existing methodologies | 6 |
| 2.3 | Proposed methodologies | 7 |
| **Chapter-3** | **Software Requirement Specification** | **8** |
| 3.1 | Function Requirements | 8 |
| 3.2 | Non Functional Requirements | 8 |
| 3.3 | Hardware Requirements | 8 |
| 3.4 | Software Requirements | 8 |
| **Chapter-4** | **Entity-Relationship Diagram** | **9** |
| **Chapter-5** | **Normalization** | **11** |
| **Chapter-6** | **Tables / Collections** | **12** |
| **Chapter-7** | **Forms (GUI) Screenshots with important code snippets** | **14** |
| **Chapter-8** | **Testing** | **16** |
| **Chapter-9** | **Conclusion** | **20** |
| | References | 20 |

---

## Acknowledgement
The successful completion of this project, **Zorvyn**, was made possible through the support and guidance of various individuals. I would like to express my gratitude to the mentors and the development team for providing the technical resources and architectural insights necessary for building a production-grade finance backend.

## Abstract
**Zorvyn** is a specialized backend system designed for financial data processing with a focus on strict Role-Based Access Control (RBAC). The system implements a Domain-Driven Modular Monolith architecture to ensure scalability and maintainability. Key features include secure financial record management, hierarchical role levels (Admin, Analyst, Viewer), and comprehensive summary analytics. Built with TypeScript and Node.js, it leverages PostgreSQL for robust data persistence and Redis for performance optimizations like rate limiting.

---

## Chapter-1: Introduction

### 1.1 Motivation
In today's digital landscape, managing financial data requires not only accuracy but also stringent security and access control. The motivation behind Zorvyn is to provide a standardized, secure, and performant backend that can handle complex financial records while ensuring that only authorized personnel can access or modify sensitive data. The project aims to bridge the gap between simple ledger systems and enterprise-level financial platforms.

### 1.2 Problem Statement and Scope
**Problem Statement:**
Existing financial management tools often suffer from bloated architectures or lack granular access control, leading to security vulnerabilities and performance bottlenecks. There is a need for a modular, secure backend that provides predictable performance and clear data ownership.

**Scope:**
- Implement a 3-tier layered architecture for clear separation of concerns.
- Develop a robust RBAC system with different permission levels.
- Provide APIs for CRUD operations on financial records (Income/Expenses).
- Implement dashboard analytics for financial summaries and trends.
- Ensure data integrity via strict schema validation (Zod) and ORM enforcement (Prisma).

### 1.3 Framework of the proposed work in project
The project follows a **Domain-Driven Modular Monolith** framework:
- **Presentation Layer**: Express.js routes and controllers.
- **Business Logic Layer**: Domain-specific services (Users, Records, Analytics).
- **Data Access Layer**: Prisma ORM interacting with PostgreSQL.
- **Cross-Cutting Concerns**: Middleware for Auth, Validation, and Global Error Handling.

---

## Chapter-2: Literature Review

### 2.1 Introduction
The literature review explores traditional monolithic architectures versus modern modular approaches in backend development, specifically for financial applications where audit trails and security are paramount.

### 2.2 Existing Methodologies
- **Traditional Monoliths**: Often lead to "Spaghetti Code" where business logic is tightly coupled, making it difficult to maintain or scale specific domains.
- **Microservices**: Offer high scalability but introduce significant complexity in networking, data consistency, and deployment overhead.

### 2.3 Proposed Methodologies
- **Modular Monolith**: Zoro-monolith architecture combines the simplicity of a single deployment with the logical separation of microservices. This allows for clear domain boundaries (e.g., Users vs. Records) while sharing a single database and deployment pipeline.

---

## Chapter-3: Software Requirement Specification

### 3.1 Function Requirements
- **User Management**: Creation, status toggling, and role assignment.
- **Record Management**: Create, Read, Update, and Soft-delete financial records.
- **Analytics**: Generate summary metrics, category breakdowns, and monthly trends.
- **Authentication**: Mock header-based authentication for RBAC testing.

### 3.2 Non-Functional Requirements
- **Security**: Implementation of Helmet headers, CORS, and Rate Limiting.
- **Performance**: Use of Redis for high-frequency operations and optimized SQL queries via Prisma.
- **Data Integrity**: Soft-delete patterns to preserve audit trails.

### 3.3 Hardware Requirements
- **Processor**: 1 GHz or faster (Minimum).
- **RAM**: 2 GB (Minimum), 4 GB (Recommended).
- **Storage**: 500 MB of available space for application and logs.

### 3.4 Software Requirements
- **Runtime**: Node.js v18.0.0 or higher.
- **Database**: PostgreSQL 14+.
- **Language**: TypeScript 5.0+.
- **Package Manager**: pnpm 9+.

---

## Chapter-4: Entity-Relationship Diagram
The system consists of three primary entities:
1. **User**: Stores identity and role information.
2. **Record**: Stores financial transactions linked to a user.
3. **AuditLog**: Captures chronological records of sensitive system actions.

- **User (1) --- (N) Record**: One user can have multiple financial records.
- **User (1) --- (N) AuditLog**: One user can perform many actions recorded in logs.

---

## Chapter-5: Normalization
The database schema follows the **Third Normal Form (3NF)**:
- **1NF**: All fields contain atomic values; every record has a unique UUID.
- **2NF**: No partial functional dependencies; all non-key attributes are fully functional on the primary key (User ID, Record ID).
- **3NF**: No transitive dependencies; non-key attributes do not depend on other non-key attributes (e.g., Category is a property of the Record, not the User).

---

## Chapter-6: Tables / Collections

### User Table
| Field | Type | Description |
| :--- | :--- | :--- |
| id | String (UUID) | Primary Key |
| email | String (Unique) | User email address |
| name | String | Full name |
| role | Enum | VIEWER, ANALYST, ADMIN |
| isActive | Boolean | Account status |

### Record Table
| Field | Type | Description |
| :--- | :--- | :--- |
| id | String (UUID) | Primary Key |
| amount | Float | Transaction value |
| type | Enum | INCOME, EXPENSE |
| category | String | E.g., Salary, Rent |
| userId | String (FK) | Reference to User |
| deletedAt | DateTime | Soft-delete marker |

---

## Chapter-7: Forms (GUI)
Since Zorvyn is a backend-focused project, the primary "GUI" for developers and testers is the **Swagger/OpenAPI Documentation**.
- **Endpoint List**: Visualize all available API routes.
- **Schema Explorer**: Input validation rules for request bodies.
- **Live Testing**: "Try it out" feature to execute requests directly from the browser.

---

## Chapter-8: Testing
The project employs a multi-layered testing strategy:
- **Integration Tests**: Using Jest (or equivalent) to test endpoints in `tests/api.test.ts`.
- **Security Audit**: Custom scripts like `verify_security.sh` and `exploit.ts` to check for RBAC bypasses.
- **Manual Verification**: Using Prisma Studio for data inspection and Swagger for manual API flow testing.

---

## Chapter-9: Conclusion
Zorvyn successfully demonstrates a secure, modular backend for financial data. By implementing RBAC at the architectural level and using a 3-tier structure, the project provides a solid foundation for enterprise-ready financial applications. Future enhancements could include JWT-based authentication and real-time WebSocket notifications for transaction updates.

## References
1. Node.js Documentation - https://nodejs.org/en/docs
2. Prisma ORM Reference - https://www.prisma.io/docs
3. Domain-Driven Design (DDD) Principles by Eric Evans.
4. OWASP API Security Project.
