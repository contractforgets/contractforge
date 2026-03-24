# @sdkforge/react

The official native React-Query adapter plugin for **SDKForge**. 

Automatically maps compiled SDKForge Clean Architecture services into robust `useQuery` and `useMutation` hooks.

## Installation
```bash
npm install -D @sdkforge/cli @sdkforge/react
```

## Usage
Simply pass this plugin locally utilizing the compiler:

```bash
npx @sdkforge/cli generate -i api.json -o src/api --plugin react
```
