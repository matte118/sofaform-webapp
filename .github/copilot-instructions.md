# Copilot Instructions for SofaForm WebApp

## Project Overview
SofaForm is an Angular 18 application for managing sofa manufacturing components, suppliers, and products. It uses Firebase Realtime Database for data persistence, Firebase Auth for authentication, and PrimeNG for UI components.

## Architecture & Key Patterns

### Core Dependencies
- **Angular 18** with standalone components and signals
- **Firebase**: Realtime Database, Auth, Storage, Functions
- **PrimeNG**: UI component library (prefer over custom styling)
- **RxJS**: Reactive patterns throughout the application
- **pdfMake**: PDF generation for product price lists (listino)

### Authentication & Authorization
- Three-tier role system: `UserRole.FOUNDER`, `UserRole.MANAGER`, `UserRole.OPERATOR`
- Guards: `AuthGuard()` for basic auth, `ManagerGuard()` and `FounderGuard()` for elevated permissions
- Timer-based guard initialization (300ms delay) to ensure Firebase auth state is ready
- Authentication state managed via `AuthService` with Firebase Auth
- Routes protected using functional guards: `canActivate: [() => AuthGuard(), () => ManagerGuard()]`
- Access denied component for unauthorized access attempts

### Data Layer Architecture
- **Models**: Located in `src/models/` - use class-based models with constructors
- **Services**: Injectable services in `src/services/` for data operations
- **Firebase Realtime DB**: Primary data store accessed via `RealtimeDbService`
- **Data Sanitization**: All Firebase writes go through `sanitizeData()` method

### Component Structure
- **Standalone Components**: All components use `standalone: true`
- **Lazy Loading**: Route-level code splitting with `loadComponent`
- **PrimeNG Integration**: Import specific modules per component needs
- **State Management**: Use RxJS observables and Angular signals for reactive updates
- **Bulk Operations**: Support for creating multiple components at once (see `gestione-componenti`)

## Core Services

### Authentication Services
- **AuthService**: User authentication, role management, user CRUD operations
- **Guards**: Functional guards for route protection (`AuthGuard`, `ManagerGuard`, `FounderGuard`, `LoginGuard`)

### Data Services
- **RealtimeDbService**: Core Firebase database operations with data sanitization
- **ComponentService**: Component CRUD, bulk operations, dependency checking
- **SupplierService**: Supplier management with relationship validation
- **VariantService**: Product variant management and component associations
- **SofaProductService**: Product lifecycle management
- **RivestimentoService**: Fabric/covering material management
- **ComponentTypeService**: Component type definitions and management

### Utility Services
- **PdfGenerationService**: PDF creation for price lists using pdfMake
- **UploadService**: File upload to Firebase Storage with progress tracking

## Data Models

### Core Models
- **User**: User accounts with roles and metadata
- **UserRole**: Enum for FOUNDER, MANAGER, OPERATOR permissions
- **Supplier**: Supplier information with contact details
- **Component**: Product components with type, supplier, price, measure
- **ComponentType**: Enum for component categories (FUSTO, GOMMA, RETE, etc.)
- **SofaProduct**: Main product entity with variants and metadata
- **Variant**: Product variations with component lists and pricing
- **Rivestimento**: Fabric materials with pricing per meter
- **ExtraMattress**: Additional mattress options

### Specialized Models
- **BulkComponent**: For bulk component creation operations
- **ListinoPdfData**: Data structure for PDF price list generation

## UI Components

### Management Interfaces
- **GestioneUtenti**: User management (manager+ only) with role assignment
- **GestioneComponenti**: Component management with single/bulk creation modes
- **GestioneFornitori**: Supplier management with dependency checking
- **GestioneTessuti**: Fabric/rivestimento management
- **AggiungiProdotto**: Multi-step product creation wizard

### Core Components
- **Home**: Main dashboard
- **Login**: Authentication interface
- **AccessDenied**: Unauthorized access handling

### PDF Templates
- **ListinoPdfTemplate**: Template component for price list PDF generation

## Development Workflows

### Running the Application
```bash
npm run start          # Development server (ng serve)
npm run build          # Production build
npm run test           # Unit tests with Karma
npm run seed           # Populate Firebase with test data
```

### Database Seeding
1. Populate `scripts/components.json` with data objects
2. Run `npm run seed` to upload to Firebase Realtime Database
3. Uses `serviceAccountKey.json` for admin authentication

### PDF Generation Workflow
1. Products are configured with variants, components, and rivestimenti
2. Use `PdfGenerationService.setListinoData()` to configure data
3. Call `generateListinoPdf()` to create and download price list PDF
4. Template rendering happens via `ListinoPdfTemplateComponent` for consistent styling

### File Upload Workflow
1. Use `UploadService.uploadProductImage()` for product images
2. Firebase Storage integration with progress tracking
3. Automatic URL generation and metadata handling
4. Image preview and removal functionality

### Component Generation
Follow Angular CLI patterns but ensure:
- Use standalone components
- Import necessary PrimeNG modules
- Implement proper error handling with try-catch
- Use `MessageService` for user notifications

### Bulk Component Creation Pattern
- Use `BulkComponentCreation` model for creating multiple similar components
- Fixed data (type, supplier) shared across all variants
- Variable data (measure, price, name) per component
- Auto-generate component names from type + supplier + measure pattern

## Code Conventions

### Service Patterns
```typescript
@Injectable({ providedIn: 'root' })
export class YourService {
  private auth = inject(Auth);
  private db = inject(Database);
  
  // Use RealtimeDbService.sanitizeData() before Firebase writes
  // Handle async operations with proper error catching
}
```

### Component Patterns
```typescript
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, /* PrimeNG modules */],
  providers: [MessageService, ConfirmationService] // When using PrimeNG dialogs
})
```

### Form Validation Patterns
- Use `formSubmitted` and `formValid` flags for validation state
- Implement `shouldShowFieldError()` methods for error display
- Use PrimeNG FloatLabel for consistent form styling
- Required field indicators with red asterisks

### Table Management Patterns
- Implement refresh mechanisms with Subject observables
- Use loading states and data caching
- Provide search/filter functionality
- Include bulk selection where appropriate
- Implement proper pagination for large datasets

### Firebase Integration
- Use `ref()`, `set()`, `push()`, `onValue()` from '@angular/fire/database'
- Always sanitize data before writing to prevent undefined values
- Handle real-time updates with `onValue()` subscriptions

### Error Handling
- Use PrimeNG `MessageService` for user-facing messages
- Implement proper loading states in components
- Log errors to console with descriptive context

### Dependency Management
- Check component dependencies before deletion
- Display usage warnings in confirmation dialogs
- Implement cascade deletion where appropriate
- Provide dependency resolution suggestions

## Key Files Reference

### Configuration
- `src/app/app.config.ts`: Firebase and application providers
- `src/environments/environments.ts`: Firebase configuration
- `src/app/app.routes.ts`: Route definitions with guards

### Core Services
- `src/services/auth.service.ts`: Authentication and user management
- `src/services/realtime-db.service.ts`: Firebase database operations
- `src/services/component.service.ts`: Component CRUD operations
- `src/services/supplier.service.ts`: Supplier management
- `src/services/variant.service.ts`: Product variant operations
- `src/services/sofa-product.service.ts`: Product lifecycle management
- `src/services/rivestimento.service.ts`: Fabric material management
- `src/services/pdf-generation.service.ts`: PDF creation service
- `src/services/upload.service.ts`: File upload handling

### Models
- Follow the pattern in `src/models/supplier.model.ts`: class-based with constructor
- Relationships: Components have Suppliers and ComponentTypes
- Products have variants and components
- All models use proper TypeScript typing

### UI Components
- Management interfaces in `src/app/components/gestione-*`
- Use PrimeNG Table, Dialog, and Form components consistently
- Implement bulk operations where applicable (see gestione-componenti)
- Follow responsive design patterns with PrimeNG Grid system

### Guards
- `src/app/guards/auth.guard.ts`: Authentication and authorization logic
- `src/app/guards/login.guard.ts`: Redirect logic for authenticated users

## Testing & Debugging
- Unit tests use Jasmine/Karma
- Use Angular DevTools for component debugging
- Firebase console for database inspection
- PrimeNG provides consistent styling - avoid custom CSS when possible

## Component-Specific Patterns

### Multi-Step Forms (AggiungiProdotto)
- Use PrimeNG Steps component for navigation
- Implement step validation before progression
- Handle complex component selection with caching
- Support for file uploads with progress tracking

### Bulk Operations (GestioneComponenti)
- TabView for single vs. bulk creation modes
- Dynamic form generation for variable data
- Real-time name generation based on selection
- Validation across multiple form sections

### User Management (GestioneUtenti)
- Role-based UI rendering
- Current user highlighting in tables
- Proper permission checking for actions
- Integration with Firebase Auth for user creation

### Dependency Checking
- Pre-deletion dependency validation
- User-friendly dependency display
- Cascade deletion options
- Relationship integrity maintenance

## Styling Conventions
- Use PrimeNG themes and CSS variables
- Implement consistent color schemes
- Use CSS Grid and Flexbox for layouts
- Follow responsive design principles
- Maintain consistent spacing and typography
