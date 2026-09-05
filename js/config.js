export const CONFIG = Object.freeze({
  appName: "AfterCare OS",
  schemaVersion: 4,
  storageKey: "aftercareOS_v4",
  legacyKeys: ["aftercareOS_v3","aftercareOS_v2","aftercareOS_v1"],
  completeDemoEnabled: true,
  journeyDays: 30,
  commerce: {
    provider: "lemonsqueezy",
    checkoutUrl: "",
    expectedStoreId: "",
    expectedProductId: "",
    expectedVariantId: "",
    activationLimitRecommended: 3
  },
  featureFlags: {
    cloudSync: false,
    accounts: false,
    analytics: false,
    payments: false
  }
});
