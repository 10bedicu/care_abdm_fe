import { lazy } from "react";
import routes from "./routes";

const manifest = {
  plugin: "care_abdm",
  routes,
  extends: [],
  components: {
    PatientHomeActions: lazy(
      () => import("./components/pluggables/PatientHomeActions")
    ),
    PatientDetailsTabDemographyGeneralInfo: lazy(
      () =>
        import("./components/pluggables/PatientDetailsTabDemographyGeneralInfo")
    ),
    EncounterActions: lazy(
      () => import("./components/pluggables/EncounterActions")
    ),
    FacilityHomeActions: lazy(
      () => import("./components/pluggables/FacilityHomeActions")
    ),
    PatientRegistrationForm: lazy(
      () => import("./components/pluggables/PatientRegistrationForm")
    ),
    PatientSearchActions: lazy(
      () => import("./components/pluggables/PatientSearchActions")
    ),
    InvoiceRecordPaymentOptions: lazy(
      () => import("./components/pluggables/InvoiceRecordPaymentOptions")
    ),
  },
  navItems: [],
  // host prefixes /facility/<id>; the sidebar shows the name verbatim
  billingNavItems: [{ name: "Scan & Pay", url: "/billing/scan-pay" }],
  encounterTabs: {
    abdm: lazy(() => import("./components/encounter-tabs/Abdm")),
  },
};

export default manifest;
