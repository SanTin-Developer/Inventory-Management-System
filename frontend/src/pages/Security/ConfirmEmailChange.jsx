import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ConfirmEmailChange() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get(`/email/confirm/${token}`)
      .then((res) => {
        setState("success");
        setMessage(res.data.status || "Email changed successfully.");
        setTimeout(() => navigate("/dashboard"), 3000);
      })
      .catch((err) => {
        setState("error");
        setMessage(
          err.response?.data?.message || "This link is invalid or has expired.",
        );
      });
  }, [token, navigate]);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow text-center">
      {state === "loading" && <p>Verifying...</p>}
      {state === "success" && (
        <>
          <p className="text-green-600 font-medium">{message}</p>
          <p className="text-sm text-gray-500 mt-2">
            Redirecting you to the dashboard...
          </p>
        </>
      )}
      {state === "error" && (
        <p className="text-red-600 font-medium">{message}</p>
      )}
    </div>
  );
}
