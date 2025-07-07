import { UserRole } from './user-role.model';

export class User {
  constructor(
    public id: string,
    public email: string,
    public displayName?: string,
    public role: UserRole = UserRole.OPERATOR,
    public creationDate: string = new Date().toISOString(),
    public lastLoginDate?: string,
    public disabled: boolean = false
  ) {}
}
