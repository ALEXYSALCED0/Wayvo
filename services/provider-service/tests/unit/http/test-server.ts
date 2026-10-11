import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { Container } from '../../../src/infrastructure/container';
import { createApp } from '../../../src/infrastructure/http/app';

export interface TestServer {
  base: string;
  server: Server;
  close(): Promise<void>;
}

export async function startApp(
  container: Container,
  env: Record<string, string | undefined> = { NODE_ENV: 'test' },
  port = 0,
): Promise<TestServer & { mockState?: ReturnType<typeof createApp>['mockState'] }> {
  const { app, mockState } = createApp(container, { env });
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  const actual = (server.address() as AddressInfo).port;
  return {
    base: `http://127.0.0.1:${actual}`,
    server,
    mockState,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export async function freePort(): Promise<number> {
  const probe = createServer();
  await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
  const { port } = probe.address() as AddressInfo;
  await new Promise<void>((resolve) => probe.close(() => resolve()));
  return port;
}

export const postJson = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
