import {
  Controller,
  Post,
  Get,
  Put,
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
@Roles('EMPLOYER')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Post()
  createEmployee(@Body() body) {
    return this.service.createEmployee(body);
  }

  @Get()
  getAllEmployees() {
    return this.service.getAllEmployees();
  }

  @Get(':id')
  getEmployeeById(@Param('id') id: string) {
    return this.service.getEmployeeById(id);
  }

  @Put(':id')
  updateEmployee(@Param('id') id: string, @Body() body) {
    return this.service.updateEmployee(id, body);
  }

  @Delete(':id')
  deleteEmployee(@Param('id') id: string) {
    return this.service.deleteEmployee(id);
  }
}