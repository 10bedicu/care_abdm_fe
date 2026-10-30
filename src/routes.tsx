import HealthInformation from "@/components/pages/HealthInformation";
import ScanPayOrders from "@/components/pages/ScanPayOrders";

const routes = {
  "/facility/:facilityId/patient/:patientId/encounter/:encounterId/healthInformation/:id":
    ({ facilityId, patientId, encounterId, id }: { facilityId: string, patientId: string, encounterId: string, id: string }) => (
      <HealthInformation
        artefactId={id}
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
      />
    ),
  "/facility/:facilityId/billing/scan-pay": ({
    facilityId,
  }: {
    facilityId: string;
  }) => <ScanPayOrders facilityId={facilityId} />,
};

export default routes;
