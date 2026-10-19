import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';


const dir = join(__dirname, '../../../src/application');
const read = (file: string) => readFileSync(join(dir, file), 'utf8');
const importLines = (file: string) => read(file).split(/\r?\n/).filter((l) => l.startsWith('import'));

const services = ['EventService', 'TripService', 'AlternativeService'];

describe('Desacoplamiento del Mediator', () => {
  it.each(services)('%s no importa a otro servicio ni al mediador', (name) => {
    const imports = importLines(`services/${name}.ts`).join('\n');
    for (const other of [...services, 'TripMediator', 'IMediator']) {
      expect(imports, `${name} importa ${other}`).not.toContain(`/${other}'`);
    }
  });

  it('TripMediator es quien conoce a los tres servicios', () => {
    const imports = importLines('mediator/TripMediator.ts').join('\n');
    for (const name of services) expect(imports).toContain(`/${name}'`);
  });
});
