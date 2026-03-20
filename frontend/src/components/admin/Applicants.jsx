import React from "react";
import Navbar from "../shared/Navbar";
import ApplicantsTable from "./ApplicantsTable";
import { useEffect } from "react";
import axios from "axios";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAllApplicants } from "@/redux/applicationSlice";

function Applicants() {
  const params = useParams();
  const dispatch = useDispatch();
  const {Applicants} = useSelector((store)=>store.application || {});
  useEffect(() => {
    const fetchAllApplicants = async () => {
      try {
        const res = await axios.get(
          `${APPLICATION_API_END_POINT}/${params.id}/applicant`,
          { withCredentials: true }
        );
        dispatch(setAllApplicants(res.data?.job?.applications || []));
      } catch (error) {
        console.error("Error fetching applicants:", error);
      }
    };
    fetchAllApplicants();
  }, [dispatch, params.id]);
  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold my-5">Applicants({Applicants?.length})</h1>
        <ApplicantsTable applicants={Applicants} />
      </div>
    </div>
  );
}

export default Applicants;
