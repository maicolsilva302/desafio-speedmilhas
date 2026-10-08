import { Controller, Get } from '@nestjs/common';

import { ClientsService } from './clients.service';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  async list(): Promise<{ clients: { id: string; name: string }[] }> {
    const clients = await this.clients.findAll();

    return { clients: clients.map(({ id, name }) => ({ id, name })) };
  }
}
