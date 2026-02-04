import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // ============================
  // CREATE EMPLOYEE (EMPLOYER)
  // ============================
  @Post()
  @Roles('EMPLOYER')
  createEmployee(@Body() body: any) {
    const { name, email, jobRole } = body;

    return this.employeesService.createEmployee(
      name,
      email,
      jobRole,
    );
  }

  // ============================
  // LIST ALL EMPLOYEES
  // ============================
  @Get()
  @Roles('EMPLOYER')
  getAllEmployees() {
    return this.employeesService.getAllEmployees();
  }

  // ============================
  // GET SINGLE EMPLOYEE
  // ============================
  @Get(':id')
  @Roles('EMPLOYER')
  getEmployee(@Param('id') id: string) {
    return this.employeesService.getEmployeeById(id);
  }

  // ============================
  // UPDATE EMPLOYEE
  // ============================
  @Patch(':id')
  @Roles('EMPLOYER')
  updateEmployee(
    @Param('id') id: string,
    @Body() body: {
      name?: string;
      email?: string;
      jobRole?: string;
    },
  ) {
    return this.employeesService.updateEmployee(id, body);
  }

  // ============================
  // DELETE EMPLOYEE (SOFT)
  // ============================
  @Delete(':id')
  @Roles('EMPLOYER')
  deleteEmployee(@Param('id') id: string) {
    return this.employeesService.deleteEmployee(id);
  }
}