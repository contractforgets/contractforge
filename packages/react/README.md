# @contractforge/react

The official native React-Query adapter plugin for **ContractForge**. 

Automatically maps compiled ContractForge Clean Architecture services into robust `useQuery` and `useMutation` hooks.

## Installation
```bash
npm install -D @contractforge/cli @contractforge/react
```

## Usage
Simply pass this plugin locally utilizing the compiler:

```bash
npx @contractforge/cli generate -i api.json -o src/api --plugin react
```
