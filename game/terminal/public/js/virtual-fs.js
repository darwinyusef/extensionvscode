export class VirtualFileSystem {
  constructor(initialState = null) {
    this.root = initialState || {
      type: 'directory',
      name: '/',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      group: 'root',
      children: {
        'home': {
          type: 'directory',
          name: 'home',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          group: 'root',
          children: {
            'student': {
              type: 'directory',
              name: 'student',
              permissions: 'drwxr-xr-x',
              owner: 'student',
              group: 'student',
              children: {}
            }
          }
        },
        'tmp': {
          type: 'directory',
          name: 'tmp',
          permissions: 'drwxrwxrwx',
          owner: 'root',
          group: 'root',
          children: {}
        },
        'etc': {
          type: 'directory',
          name: 'etc',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          group: 'root',
          children: {}
        },
        'var': {
          type: 'directory',
          name: 'var',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          group: 'root',
          children: {}
        }
      }
    };
    this.currentPath = '/home/student';
  }

  getNode(path) {
    if (path === '/') return this.root;

    const parts = path.split('/').filter(p => p);
    let current = this.root;

    for (const part of parts) {
      if (!current.children || !current.children[part]) {
        return null;
      }
      current = current.children[part];
    }

    return current;
  }

  getAbsolutePath(path) {
    if (path.startsWith('/')) return path;
    if (path === '~') return '/home/student';
    if (path.startsWith('~/')) return '/home/student' + path.slice(1);

    const parts = this.currentPath.split('/').filter(p => p);
    const pathParts = path.split('/');

    for (const part of pathParts) {
      if (part === '..') {
        parts.pop();
      } else if (part !== '.' && part !== '') {
        parts.push(part);
      }
    }

    return '/' + parts.join('/');
  }

  exists(path) {
    const absPath = this.getAbsolutePath(path);
    return this.getNode(absPath) !== null;
  }

  isDirectory(path) {
    const absPath = this.getAbsolutePath(path);
    const node = this.getNode(absPath);
    return node && node.type === 'directory';
  }

  isFile(path) {
    const absPath = this.getAbsolutePath(path);
    const node = this.getNode(absPath);
    return node && node.type === 'file';
  }

  readFile(path) {
    const absPath = this.getAbsolutePath(path);
    const node = this.getNode(absPath);

    if (!node) {
      throw new Error(`cat: ${path}: No such file or directory`);
    }

    if (node.type !== 'file') {
      throw new Error(`cat: ${path}: Is a directory`);
    }

    return node.content || '';
  }

  writeFile(path, content, mode = 'w') {
    const absPath = this.getAbsolutePath(path);
    const parts = absPath.split('/').filter(p => p);
    const filename = parts.pop();
    const dirPath = '/' + parts.join('/');

    const dir = this.getNode(dirPath);
    if (!dir || dir.type !== 'directory') {
      throw new Error(`cannot create file '${path}': No such file or directory`);
    }

    if (mode === 'a' && dir.children[filename]) {
      dir.children[filename].content += content;
    } else {
      dir.children[filename] = {
        type: 'file',
        name: filename,
        permissions: '-rw-r--r--',
        owner: 'student',
        group: 'student',
        content: content,
        modified: new Date().toISOString()
      };
    }

    return true;
  }

  createDirectory(path) {
    const absPath = this.getAbsolutePath(path);
    const parts = absPath.split('/').filter(p => p);
    const dirname = parts.pop();
    const parentPath = '/' + parts.join('/');

    const parent = this.getNode(parentPath);
    if (!parent || parent.type !== 'directory') {
      throw new Error(`mkdir: cannot create directory '${path}': No such file or directory`);
    }

    if (parent.children[dirname]) {
      throw new Error(`mkdir: cannot create directory '${path}': File exists`);
    }

    parent.children[dirname] = {
      type: 'directory',
      name: dirname,
      permissions: 'drwxr-xr-x',
      owner: 'student',
      group: 'student',
      children: {},
      modified: new Date().toISOString()
    };

    return true;
  }

  listDirectory(path = null) {
    const dirPath = path ? this.getAbsolutePath(path) : this.currentPath;
    const dir = this.getNode(dirPath);

    if (!dir) {
      throw new Error(`ls: cannot access '${path}': No such file or directory`);
    }

    if (dir.type !== 'directory') {
      return [{ name: dir.name, ...dir }];
    }

    return Object.values(dir.children);
  }

  changeDirectory(path) {
    const absPath = this.getAbsolutePath(path);
    const node = this.getNode(absPath);

    if (!node) {
      throw new Error(`cd: ${path}: No such file or directory`);
    }

    if (node.type !== 'directory') {
      throw new Error(`cd: ${path}: Not a directory`);
    }

    this.currentPath = absPath;
    return this.currentPath;
  }

  getCurrentPath() {
    return this.currentPath;
  }

  remove(path, recursive = false) {
    const absPath = this.getAbsolutePath(path);
    const parts = absPath.split('/').filter(p => p);
    const filename = parts.pop();
    const parentPath = '/' + parts.join('/');

    const parent = this.getNode(parentPath);
    if (!parent || !parent.children[filename]) {
      throw new Error(`rm: cannot remove '${path}': No such file or directory`);
    }

    const node = parent.children[filename];
    if (node.type === 'directory' && !recursive) {
      throw new Error(`rm: cannot remove '${path}': Is a directory`);
    }

    delete parent.children[filename];
    return true;
  }

  serialize() {
    return {
      root: this.root,
      currentPath: this.currentPath
    };
  }

  static deserialize(data) {
    const fs = new VirtualFileSystem(data.root);
    fs.currentPath = data.currentPath;
    return fs;
  }
}
