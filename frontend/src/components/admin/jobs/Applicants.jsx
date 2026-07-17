import React from "react";
import Navbar from "@/components/shared/Navbar";
import ApplicantsTable from "@/components/admin/jobs/ApplicantsTable";
import { useEffect } from "react";
import axios from "axios";
import { APPLICATION_API_END_POINT } from "@/utils/constant";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAllApplicants } from "@/store/slices/applicationSlice";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function Applicants() {
  const params = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { Applicants } = useSelector((store) => store.application || {});

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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="bg-white card-shadow rounded-lg p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate("/admin/jobs")}
                  variant="outline"
                  className="btn-secondary flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Applicants
                  </h1>
                  <p className="text-sm text-gray-500">
                    {Applicants?.length || 0} total applicant{Applicants?.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2">
                <span className="text-sm font-semibold text-gray-700">{Applicants?.length || 0} total</span>
              </div>
            </div>
          </div>

          <ApplicantsTable applicants={Applicants} />
        </div>
      </div>
    </div>
  );
}

export default Applicants;
