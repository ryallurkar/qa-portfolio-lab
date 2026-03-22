// esbuild-runner config — must pass tsconfigRaw so that emitDecoratorMetadata
// is enabled. Without this, TypeScript parameter type metadata is not emitted
// and routing-controllers cannot determine the target class for @Body() params,
// which prevents class-validator from running.
module.exports = {
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    },
  },
};
