import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EMPLOYER')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // ✅ ADD EMPLOYEE
  @Post()
  create(@Body() body) {
    return this.employeesService.createEmployee(body);
  }

  // ✅ LIST EMPLOYEES
  @Get()
  getAll() {
    return this.employeesService.getAllEmployees();
  }

  // ✅ VIEW EMPLOYEE DETAILS + HISTORY
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.employeesService.getEmployeeById(id);
  }

  // ✅ SOFT DELETE
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.employeesService.deleteEmployee(id);
  }
}
