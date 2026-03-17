import { prisma } from './prisma';

interface LDAPConfig {
  url: string;
  baseDN: string;
  bindUser: string;
  bindPassword: string;
}

async function getLDAPConfig(): Promise<LDAPConfig> {
  const configs = await prisma.systemConfig.findMany({
    where: { chave: { startsWith: 'ldap.' } },
  });
  const map: Record<string, string> = {};
  for (const c of configs) map[c.chave] = c.valor;

  return {
    url: map['ldap.url'] || process.env.LDAP_URL || '',
    baseDN: map['ldap.base_dn'] || process.env.LDAP_BASE_DN || '',
    bindUser: map['ldap.bind_user'] || process.env.LDAP_BIND_USER || '',
    bindPassword: map['ldap.bind_password'] || process.env.LDAP_BIND_PASSWORD || '',
  };
}

export async function authenticateLDAP(email: string, password: string): Promise<boolean> {
  try {
    const config = await getLDAPConfig();
    if (!config.url || !config.baseDN) return false;

    // Dynamic import to avoid issues in build
    const ldap = await import('ldapjs');
    const client = ldap.createClient({ url: config.url });

    return new Promise((resolve) => {
      const userDN = `uid=${email.split('@')[0]},${config.baseDN}`;
      client.bind(userDN, password, (err) => {
        client.unbind();
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });

      client.on('error', () => {
        resolve(false);
      });
    });
  } catch {
    return false;
  }
}

export async function syncLDAP(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  try {
    const config = await getLDAPConfig();
    if (!config.url || !config.baseDN) {
      return { synced: 0, errors: ['LDAP não configurado'] };
    }

    const ldap = await import('ldapjs');
    const client = ldap.createClient({ url: config.url });

    await new Promise<void>((resolve, reject) => {
      client.bind(config.bindUser, config.bindPassword, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const users = await new Promise<Array<{ email: string; nome: string }>>((resolve, reject) => {
      const results: Array<{ email: string; nome: string }> = [];
      client.search(
        config.baseDN,
        {
          filter: '(objectClass=person)',
          attributes: ['mail', 'displayName', 'cn'],
          scope: 'sub',
        },
        (err, res) => {
          if (err) return reject(err);
          res.on('searchEntry', (entry) => {
            const attrs = entry.attributes.reduce(
              (acc: Record<string, string>, a: { type: string; values: string[] }) => {
                acc[a.type] = a.values[0];
                return acc;
              },
              {}
            );
            if (attrs.mail) {
              results.push({
                email: attrs.mail,
                nome: attrs.displayName || attrs.cn || attrs.mail,
              });
            }
          });
          res.on('end', () => resolve(results));
          res.on('error', reject);
        }
      );
    });

    client.unbind();

    for (const u of users) {
      try {
        await prisma.user.upsert({
          where: { email: u.email },
          update: { nome: u.nome },
          create: { email: u.email, nome: u.nome, role: 'usuario' },
        });
        synced++;
      } catch (e) {
        errors.push(`Erro ao sincronizar ${u.email}`);
      }
    }
  } catch (e: unknown) {
    errors.push(`Erro de conexão LDAP: ${e instanceof Error ? e.message : 'Desconhecido'}`);
  }

  return { synced, errors };
}

export async function testLDAPConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getLDAPConfig();
    if (!config.url) return { success: false, message: 'URL LDAP não configurada' };

    const ldap = await import('ldapjs');
    const client = ldap.createClient({ url: config.url });

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        client.unbind();
        resolve({ success: false, message: 'Timeout na conexão' });
      }, 5000);

      client.bind(config.bindUser, config.bindPassword, (err) => {
        clearTimeout(timeout);
        client.unbind();
        if (err) {
          resolve({ success: false, message: err.message });
        } else {
          resolve({ success: true, message: 'Conexão estabelecida com sucesso' });
        }
      });

      client.on('error', (err: Error) => {
        clearTimeout(timeout);
        resolve({ success: false, message: err.message });
      });
    });
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' };
  }
}
