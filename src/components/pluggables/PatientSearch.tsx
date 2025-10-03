import { apis } from "@/apis";
import { useDebounceState } from "@/hooks/useDebouncedState";
import { useQuery } from "@tanstack/react-query";
import { FC, useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";

type SearchOption = {
  key: string;
  type: string;
  placeholder: string;
  value: string;
  display: string;
  onSearch?: (value: string) => void;
};

type PatientSearchProps = {
  state: UseFormReturn;
  facilityId: string;
};

const PatientSearch: FC<PatientSearchProps> = ({ state, facilityId }) => {
  const [token, setToken] = useState<string>("");
  const debouncedToken = useDebounceState(token, 500);

  const { data: patient, isFetching } = useQuery({
    queryKey: ["patient", debouncedToken],
    queryFn: () => apis.hip.getPatientByToken(debouncedToken),
    enabled: !!debouncedToken,
  });

  const { data: healthFacility } = useQuery({
    queryKey: ["healthFacility", facilityId],
    queryFn: () => apis.healthFacility.get(facilityId),
    enabled: !!facilityId,
  });

  useEffect(() => {
    if (!healthFacility) {
      return;
    }

    const searchOptions = [
      {
        key: "abha_token",
        type: "text",
        placeholder: "Search by Abha Token",
        value: "",
        display: "Abha Token",
        onSearch: (value: string) => {
          setToken(value.trim());
          state.setValue("identifierSearch", {
            config: "abha_token",
            value: value.trim(),
          });
        },
      },
    ] as SearchOption[];
    const serachOptionKeys = searchOptions.map((option) => option.key);
    state.setValue("searchOptions", [
      ...state
        .getValues("searchOptions")
        .filter(
          (option: SearchOption) => !serachOptionKeys.includes(option.key)
        ),
      ...searchOptions,
    ]);
  }, [healthFacility]);

  useEffect(() => {
    if (token) {
      state.setValue("patientList", {
        partial: true,
        results: patient
          ? [
              {
                id: patient.id,
                name: patient.name,
                phone_number: patient.phone_number,
                gender: patient.gender,
                partial_id: patient.partial_id,
              },
            ]
          : [],
      });
      state.setValue("isFetching", isFetching);
    }
  }, [patient, isFetching]);

  return null;
};

export default PatientSearch;
