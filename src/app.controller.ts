import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
        @Public()
        @Get()
        getHealth() {
                return {
                        status: 'ok',
                        message: 'Robomanthan Leave Management System API',
                        version: '1.0.0',
                        timestamp: new Date().toISOString(),
                        endpoints: {
                                auth: '/auth',
                                profile: '/profile',
                                employees: '/employees',
                                leaves: '/leaves',
                                dashboard: '/dashboard',
                                reports: '/reports',
                        },
                };
        }

        @Public()
        @Get('health')
        healthCheck() {
                return {
                        status: 'healthy',
                        uptime: process.uptime(),
                        timestamp: new Date().toISOString(),
                };
        }
}
