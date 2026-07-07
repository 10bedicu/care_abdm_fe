import HealthInformation from "@/components/pages/HealthInformation";

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
};

export default routes;
