import { CONFIG } from "./config.js";

const LS_BASE = "https://api.lemonsqueezy.com/v1/licenses";

function configured(){
  const c = CONFIG.commerce || {};
  return Boolean(c.expectedProductId || c.expectedVariantId || c.expectedStoreId);
}

function productMatches(meta={}){
  const c = CONFIG.commerce || {};
  if(c.expectedStoreId && String(meta.store_id) !== String(c.expectedStoreId)) return false;
  if(c.expectedProductId && String(meta.product_id) !== String(c.expectedProductId)) return false;
  if(c.expectedVariantId && String(meta.variant_id) !== String(c.expectedVariantId)) return false;
  return true;
}

function emailMatches(meta={}, email=""){
  if(!email) return true;
  return String(meta.customer_email || "").trim().toLowerCase() === String(email).trim().toLowerCase();
}

async function postForm(endpoint, values){
  const body = new URLSearchParams(values);
  const response = await fetch(`${LS_BASE}/${endpoint}`, {
    method:"POST",
    headers:{
      "Accept":"application/json",
      "Content-Type":"application/x-www-form-urlencoded"
    },
    body
  });
  const data = await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error || "License service request failed.");
  return data;
}

export const commerce = {
  providerName: "Lemon Squeezy",
  isConfigured: configured,

  checkoutUrl(){
    return CONFIG.commerce?.checkoutUrl || "";
  },

  async activate({licenseKey,email,instanceName}){
    if(!configured()) throw new Error("Commerce is not configured yet.");
    const data = await postForm("activate", {
      license_key: licenseKey,
      instance_name: instanceName || "AfterCare OS"
    });

    if(!data.activated) throw new Error(data.error || "License could not be activated.");
    if(!productMatches(data.meta)) throw new Error("This license does not belong to AfterCare OS.");
    if(!emailMatches(data.meta,email)) throw new Error("The email does not match this purchase.");

    return {
      valid: true,
      provider: "lemonsqueezy",
      licenseKey,
      instanceId: data.instance?.id || "",
      customerEmail: data.meta?.customer_email || email || "",
      productId: data.meta?.product_id || "",
      variantId: data.meta?.variant_id || "",
      activatedAt: new Date().toISOString()
    };
  },

  async validate(entitlement){
    if(!entitlement?.licenseKey || !configured()) return false;
    const values = { license_key: entitlement.licenseKey };
    if(entitlement.instanceId) values.instance_id = entitlement.instanceId;

    const data = await postForm("validate", values);
    return Boolean(data.valid && productMatches(data.meta) && emailMatches(data.meta,entitlement.customerEmail));
  }
};
