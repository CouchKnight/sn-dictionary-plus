// Regression guard: the DB folder must follow PluginConfig.json's pluginID.
// A hardcoded 'plugins/<id>/' made the Dictionary+ fork open the stock
// plugin's base.db/user.db and freeze the device on lookup.
import {readFileSync, readdirSync, statSync} from 'fs';
import {join} from 'path';

const ROOT = join(__dirname, '..');
const config = JSON.parse(
  readFileSync(join(ROOT, 'PluginConfig.json'), 'utf8'),
) as {pluginID: string};

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap(entry => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return sourceFiles(full);
    }
    return /\.(ts|tsx|js)$/.test(entry) ? [full] : [];
  });

describe('plugin DB location', () => {
  test('index.js derives PLUGIN_LOCATION from PluginConfig.json', () => {
    const index = readFileSync(join(ROOT, 'index.js'), 'utf8');
    expect(index).toContain("import {pluginID} from './PluginConfig.json';");
    expect(index).toContain('const PLUGIN_LOCATION = `plugins/${pluginID}/`;');
  });

  test('no runtime source hardcodes a plugins/<16-char id>/ path', () => {
    const files = [join(ROOT, 'index.js'), ...sourceFiles(join(ROOT, 'src'))];
    const offenders = files.filter(f =>
      /plugins\/[a-z0-9]{16}\//.test(readFileSync(f, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  test('pluginID matches the packaging script format', () => {
    expect(config.pluginID).toMatch(/^[a-z0-9]{16}$/);
  });
});
