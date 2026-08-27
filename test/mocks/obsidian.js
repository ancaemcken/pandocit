/**
 * Jest stub for the `obsidian` package, which ships type definitions only
 * (no runtime entry point). Tests exercise pure helpers; `Platform.isDesktop`
 * is all that `platformAdapter` reads at runtime.
 */
module.exports = {
  Platform: { isDesktop: true },
};
