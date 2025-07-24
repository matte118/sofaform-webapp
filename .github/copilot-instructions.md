# Copilot Instructions for SofaForm WebApp

## Project Overview
SofaForm is an Angular 18 application for managing sofa manufacturing components, suppliers, and products. It uses Firebase Realtime Database for data persistence, Firebase Auth for authentication, and PrimeNG for UI components.

## Architecture & Key Patterns

### Core Dependencies
- **Angular 18** with standalone components and signals
- **Firebase**: Realtime Database, Auth, Storage, Functions
- **PrimeNG**: UI component library (prefer over custom styling)
- **RxJS**: Reactive patterns throughout the application

### Authentication & Authorization
- Role-based access with `UserRole.MANAGER` and standard user levels
- Guards: `AuthGuard()` for basic auth, `ManagerGuard()` for elevated permissions
- Authentication state managed via `AuthService` with Firebase Auth
- Routes protected using functional guards: `canActivate: [() => AuthGuard()]`

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

### Component Generation
Follow Angular CLI patterns but ensure:
- Use standalone components
- Import necessary PrimeNG modules
- Implement proper error handling with try-catch
- Use `MessageService` for user notifications

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

### Firebase Integration
- Use `ref()`, `set()`, `push()`, `onValue()` from '@angular/fire/database'
- Always sanitize data before writing to prevent undefined values
- Handle real-time updates with `onValue()` subscriptions

### Error Handling
- Use PrimeNG `MessageService` for user-facing messages
- Implement proper loading states in components
- Log errors to console with descriptive context

## Key Files Reference

### Configuration
- `src/app/app.config.ts`: Firebase and application providers
- `src/environments/environments.ts`: Firebase configuration
- `src/app/app.routes.ts`: Route definitions with guards

### Core Services
- `src/services/auth.service.ts`: Authentication and user management
- `src/services/realtime-db.service.ts`: Firebase database operations
- `src/services/component.service.ts`: Component CRUD operations

### Models
- Follow the pattern in `src/models/supplier.model.ts`: class-based with constructor
- Relationships: Components have Suppliers and ComponentTypes
- Products have variants and components

### UI Components
- Management interfaces in `src/app/components/gestione-*`
- Use PrimeNG Table, Dialog, and Form components consistently
- Implement bulk operations where applicable (see gestione-componenti)

## Testing & Debugging
- Unit tests use Jasmine/Karma
- Use Angular DevTools for component debugging
- Firebase console for database inspection
- PrimeNG provides consistent styling - avoid custom CSS when possible
