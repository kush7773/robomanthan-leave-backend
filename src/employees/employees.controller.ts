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
      
      @Controller('employees')
      @UseGuards(JwtAuthGuard)
      export class EmployeesController {
        constructor(private readonly employeesService: EmployeesService) {}
      
        // ADD EMPLOYEE
        @Post()
        create(@Body() body) {
          return this.employeesService.createEmployee(
            body.name,
            body.email,
            body.jobRole,
            body.leaveBalances,
          );
        }
      
        // LIST ACTIVE EMPLOYEES
        @Get()
        list() {
          return this.employeesService.listEmployees();
        }
      
        // EDIT EMPLOYEE (EMPLOYER)
        @Put(':id')
        update(@Param('id') id: string, @Body() body) {
          return this.employeesService.updateEmployee(
            id,
            body.jobRole,
            body.leaveBalances,
          );
        }
      
        // SOFT DELETE EMPLOYEE
        @Delete(':id')
        delete(@Param('id') id: string) {
          return this.employeesService.softDeleteEmployee(id);
        }
      }
      