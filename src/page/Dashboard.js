import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import "datatables.net-dt/css/jquery.dataTables.css";
import $ from "jquery";
import DataTable from "datatables.net-dt";
import Swal from "sweetalert2";
import { FaFilter, FaSearch, FaFileExport } from "react-icons/fa";
import gapi from "gapi-client";

$.DataTable = DataTable;

const Dashboard = () => {
  const tableRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [userData, setUserData] = useState([]);
  // const [showControls, setShowControls] = useState(false);
  const [sheetName, setSheetName] = useState("");

  const [filters, setFilters] = useState({
    genders: [],
    cities: [],
    countries: [],
    states: [],
    jobTitles: [],
    companyNames: [],
  });
  
  const [filterValues, setFilterValues] = useState({
    gender: 'all',
    city: 'all',
    country: 'all',
    state: 'all',
    jobTitle: 'all',
    companyName: 'all'
  });

  const fetchSheetName = useCallback(async () => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/1f8SWpvGmnFmODyyy2bpnCItspyBliMwtbKKOmHERBzE/?key=AIzaSyAd52jtegXY5CT_JfQ4SvoJYoQZtEye9_o`
      );
      const data = await response.json();
      setSheetName(data.properties.title);
    } catch (error) {
      console.error("Error fetching sheet name:", error);
    }
  }, []);

  const dataTableRef = useRef(null);

  const API_URL =
    "https://sheets.googleapis.com/v4/spreadsheets/1f8SWpvGmnFmODyyy2bpnCItspyBliMwtbKKOmHERBzE/values/user_mock_data?alt=json&key=AIzaSyAd52jtegXY5CT_JfQ4SvoJYoQZtEye9_o";

  const tableConfig = useMemo(
    () => ({
      columns: [
        { title: "id" },
        { title: "first_name" },
        { title: "last_name" },
        { title: "email" },
        { title: "gender" },
        { title: "city" },
        { title: "country" },
        { title: "country_code" },
        { title: "state" },
        { title: "street_address" },
        { title: "job_title" },
        { title: "company_name" },
        { title: "photo" },
      ],
      responsive: true,
      dom: 'rt<"bottom"p>', 
      pageLength: 10,
      deferRender: true,
      processing: true,
      searching: true,
      lengthChange: false,
      initComplete: function () {
        // pagination outside the wrapper
        const paginationContainer = $(this)
          .closest(".dataTables_wrapper")
          .find(".bottom");
        paginationContainer.addClass("pagination-container");
        paginationContainer
          .detach()
          .insertAfter($(this).closest(".table-responsive"));
      },
    }),
    []
  );

  const exportToSheet = useCallback(async () => {
    try {
      const filteredData = dataTableRef.current
        .rows({ search: "applied" })
        .data()
        .toArray();

      const values = [
        [
          "id",
          "first_name",
          "last_name",
          "email",
          "gender",
          "city",
          "country",
          "country_code",
          "state",
          "street_address",
          "job_title",
          "company_name",
          "photo",
        ],
        ...filteredData.map((row) => row.slice(0, -1)), 
      ];

      // Use Google Sheets API v4
      const response = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              title: `Exported Data ${new Date().toLocaleDateString()}`,
            },
            sheets: [
              {
                properties: {
                  title: "Sheet1",
                },
                data: [
                  {
                    startRow: 0,
                    startColumn: 0,
                    rowData: values.map((row) => ({
                      values: row.map((cell) => ({
                        userEnteredValue: { stringValue: cell.toString() },
                      })),
                    })),
                  },
                ],
              },
            ],
          }),
        }
      );

      const result = await response.json();

      if (result.spreadsheetId) {
        const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}`;
        Swal.fire({
          title: "Success!",
          text: "Data has been exported to a new Google Sheet",
          icon: "success",
          footer: `<a href="${spreadsheetUrl}" target="_blank">Open Spreadsheet</a>`,
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      if (error.message.includes("auth")) {
        Swal.fire({
          title: "Authentication Required",
          text: "Please sign in to Google to export data",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Sign In",
        }).then((result) => {
          if (result.isConfirmed) {
            gapi.auth2.getAuthInstance().signIn();
          }
        });
      } else {
        Swal.fire({
          title: "Error",
          text: "Failed to export data",
          icon: "error",
        });
      }
    }
  }, []);

  useEffect(() => {
    // Load the Google API client
    const loadGoogleAPI = () => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        gapi.load("client:auth2", initClient);
      };
      document.body.appendChild(script);
    };

    // Initialize the Google API client
    const initClient = () => {
      gapi.client.init({
        apiKey: "AIzaSyCyauCWqOy72VTzfMy3jO3OVntnaaQGnho",
        clientId:
          "33502154602-a2nbhf8mdce66g1u2t0sk6ad4cbfnf54.apps.googleusercontent.com",
        discoveryDocs: [
          "https://sheets.googleapis.com/$discovery/rest?version=v4",
        ],
        scope: "https://www.googleapis.com/auth/spreadsheets",
      });
    };

    loadGoogleAPI();
  }, []);

  const handleSearch = useCallback((value) => {
    if (dataTableRef.current) {
      dataTableRef.current.search(value).draw();
    }
  }, []);

  const filterFunction = useCallback((settings, data) => {
    if (!data) return true;

    const filters = {
      gender: document.getElementById("genderFilter")?.value,
      city: document.getElementById("cityFilter")?.value,
      country: document.getElementById("countryFilter")?.value,
      state: document.getElementById("stateFilter")?.value,
      jobTitle: document.getElementById("jobTitleFilter")?.value,
      companyName: document.getElementById("companyNameFilter")?.value,
    };

    const columns = {
      gender: 4,
      city: 5,
      country: 6,
      state: 8,
      jobTitle: 10,
      companyName: 11,
    };

    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== "all") {
        const cellValue = data[columns[key]] || "None";
        if (cellValue.trim().toLowerCase() !== value.trim().toLowerCase()) {
          return false;
        }
      }
    }

    return true;
  }, []);

  useEffect(() => {
    fetchSheetName();
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      .dataTables_wrapper {
        position: relative;
        width: 100%;
      }
      
      .table-responsive {
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        margin-bottom: 0;
      }
      
      .table thead th {
        position: sticky !important;
        top: 0 !important;
        background: white !important;
        z-index: 1 !important;
        border-bottom: 2px solid #dee2e6 !important;
      }

      .pagination-container {
        position: sticky;
        bottom: 0;
        background: white;
        padding: 1rem 0;
        border-top: 1px solid #dee2e6;
        display: flex;
        justify-content: flex-end;
        margin-top: 1rem;
      }

      .dataTables_paginate {
        padding-top: 0 !important;
      }

      .dataTables_paginate .paginate_button {
        padding: 0.5rem 1rem;
        margin-left: 0.25rem;
        border: 1px solid #dee2e6;
        border-radius: 0.25rem;
        cursor: pointer;
        text-decoration: none !important;
        color: #6c757d !important;
      }

      .dataTables_paginate .paginate_button.current {
        background: #28b463;
        color: white !important;
        border-color: #28b463;
        text-decoration: none !important;
      }

      .dataTables_paginate .paginate_button:hover {
        background: #e9ecef;
        color: #28b463 !important;
        text-decoration: none !important;
      }

      .dataTables_paginate .paginate_button.disabled {
        color: #6c757d !important;
        cursor: not-allowed;
        background: #fff;
        text-decoration: none !important;
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, [fetchSheetName]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      const data = result.values.slice(1).map((row) => ({
        id: row[0] || "",
        first_name: row[1] || "",
        last_name: row[2] || "",
        email: row[3] || "",
        gender: row[4] || "",
        city: row[5] || "",
        country: row[6] || "",
        country_code: row[7] || "",
        state: row[8] || "",
        street_address: row[9] || "",
        job_title: row[10] || "",
        company_name: row[11] || "",
        photo: row[12] || "",
      }));

      setUserData(data);

      const newFilters = {
        genders: [...new Set(data.map((user) => user.gender || "None"))],
        cities: [...new Set(data.map((user) => user.city || "None"))],
        countries: [...new Set(data.map((user) => user.country || "None"))],
        states: [...new Set(data.map((user) => user.state || "None"))],
        jobTitles: [...new Set(data.map((user) => user.job_title || "None"))],
        companyNames: [
          ...new Set(data.map((user) => user.company_name || "None")),
        ],
      };
      setFilters(newFilters);

      const tableData = data.map((user) => [
        user.id,
        user.first_name,
        user.last_name,
        user.email,
        user.gender,
        user.city,
        user.country,
        user.country_code,
        user.state,
        user.street_address,
        user.job_title,
        user.company_name,
        `<img src="${user.photo}" alt="User Photo" style="width:50px;height:50px;loading:lazy"/>`,
      ]);

      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }

      if (tableRef.current) {
        dataTableRef.current = $(tableRef.current).DataTable({
          ...tableConfig,
          data: tableData,
        });

        $.fn.dataTable.ext.search.push(filterFunction);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [API_URL, tableConfig, filterFunction]);

  useEffect(() => {
    fetchData();
    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }
    };
  }, [fetchData]);

  const FilterSelect = ({ id, label, options }) => (
    <div className="me-3 mb-3" style={{ display: "inline-block" }}>
      <label htmlFor={id} className="form-label d-block">
        {label}:
      </label>
      <select
        id={id}
        className="form-select"
        style={{ width: "auto", minWidth: "150px" }}
        value={filterValues[id.replace('Filter', '')]}
        onChange={(e) => {
          const newValue = e.target.value;
          setFilterValues(prev => ({
            ...prev,
            [id.replace('Filter', '')]: newValue
          }));
          dataTableRef.current.draw();
        }}
      >
        <option value="all">All</option>
        {options.sort().map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          Error loading data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {isLoading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="mb-0">{sheetName ? `${sheetName}` : "User Data"}</h1>
          </div>

          {/* Fixed position search and pagination controls */}
          <div className="position-sticky top-0 bg-white py-3 z-10 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-outline-success me-2"
                  onClick={exportToSheet}
                >
                  <FaFileExport className="me-2" />
                  Export to Sheet
                </button>
                <button
                  className="btn btn-outline-secondary me-3"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter className="me-2" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
              </div>

              <div className="d-flex align-items-center ms-auto">
                <FaSearch className="text-secondary me-2" />
                <input
                  type="search"
                  className="form-control form-control-sm"
                  placeholder="Search ..."
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="mb-3">
              <div className="d-flex flex-wrap">
                <FilterSelect
                  id="genderFilter"
                  label="Gender"
                  options={filters.genders}
                />
                <FilterSelect
                  id="cityFilter"
                  label="City"
                  options={filters.cities}
                />
                <FilterSelect
                  id="countryFilter"
                  label="Country"
                  options={filters.countries}
                />
                <FilterSelect
                  id="stateFilter"
                  label="State"
                  options={filters.states}
                />
                <FilterSelect
                  id="jobTitleFilter"
                  label="Job Title"
                  options={filters.jobTitles}
                />
                <FilterSelect
                  id="companyNameFilter"
                  label="Company Name"
                  options={filters.companyNames}
                />
              </div>
            </div>
          )}

          <div className="table-responsive" style={{ overflowY: "auto" }}>
            <table
              ref={tableRef}
              className="table table-striped table-hover table-bordered cell-border rounded"
              id="myTable"
            />
          </div>

          {/* Fixed position pagination controls */}
          <div className="position-sticky bottom-0 bg-white py-3 z-10 border-top">
            <div
              id="myTable_paginate"
              className="dataTables_paginate paging_simple_numbers text-de"
            >
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
