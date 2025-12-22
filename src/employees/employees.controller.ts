import {
        Controller,
        Get,
        Post,
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
        constructor(
          private readonly employeesService: EmployeesService,
        ) {}
      
        // ADD EMPLOYEE
        @Post()
        createEmployee(@Body() body) {
          return this.employeesService.createEmployee(
            body.name,
            body.email,
            body.jobRole,
            body.leaveBalances,
          );
        }
      
        // LIST EMPLOYEES
        @Get()
        getAllEmployees() {
          return this.employeesService.getAllEmployees();
        }
      
        // VIEW EMPLOYEE DETAILS
        @Get(':id')
        getEmployee(@Param('id') id: string) {
          return this.employeesService.getEmployeeById(id);
        }
      
        // VIEW EMPLOYEE LEAVE HISTORY
        @Get(':id/leaves')
        getEmployeeLeaves(@Param('id') id: string) {
          return this.employeesService.getEmployeeLeaveHistory(id);
        }
      
        // UPDATE EMPLOYEE
        @Put(':id')
        updateEmployee(
          @Param('id') id: string,
          @Body() body,
        ) {
          return this.employeesService.updateEmployee(
            id,
            body.jobRole,
            body.leaveBalances,
          );
        }
      
        // SOFT DELETE EMPLOYEE
        @Delete(':id')
        deleteEmployee(@Param('id') id: string) {
          return this.employeesService.deleteEmployee(id);
        }
      }
      