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

$.DataTable = DataTable;

const Dashboard = ({ token, userName }) => {
  const tableRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [userData, setUserData] = useState([]);
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
    gender: "all",
    city: "all",
    country: "all",
    state: "all",
    jobTitle: "all",
    companyName: "all",
  });

  const SPREADSHEET_ID = "1f8SWpvGmnFmODyyy2bpnCItspyBliMwtbKKOmHERBzE";

  const fetchSheetName = useCallback(async () => {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch sheet name");

      const data = await response.json();
      setSheetName(data.properties.title);
    } catch (error) {
      console.error("Error fetching sheet name:", error);
      setError("Failed to fetch sheet name");
    }
  }, [token]);

  const handleExport = async () => {
    if (!token) {
      Swal.fire("Error", "Not authenticated. Please log in again.", "error");
      return;
    }

    try {
      // Show loading state
      const loadingAlert = Swal.fire({
        title: "Preparing Export",
        text: "Please wait...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const filteredData = [];
      const table = dataTableRef.current;

      // Get all visible rows from DataTable 
      table.rows({ search: "applied" }).every(function () {
        const rowData = this.data();
        const photoHtml = rowData[12];
        const photoUrl = photoHtml.match(/src="([^"]+)"/)?.[1] || "";
        // console.log("Photo URL:", photoUrl);
        filteredData.push({
          id: rowData[0],
          first_name: rowData[1],
          last_name: rowData[2],
          email: rowData[3],
          gender: rowData[4],
          city: rowData[5],
          country: rowData[6],
          country_code: rowData[7],
          state: rowData[8],
          street_address: rowData[9],
          job_title: rowData[10],
          company_name: rowData[11],
          photo: photoUrl
        });
      });

      // Create new spreadsheet
      const createResponse = await fetch(
        "https://sheets.googleapis.com/v4/spreadsheets",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              title: `${sheetName} ${new Date().toLocaleString()}`,
            },
            sheets: [
              {
                properties: {
                  title: "Sheet1",
                },
              },
            ],
          }),
        }
      );

      if (createResponse.status === 400) {
        throw new Error("Failed to create spreadsheet. Ensure that the sheet name is valid.");
      } else if (createResponse.status === 401) {
        throw new Error("Failed to create spreadsheet. Not authenticated. Please log in again.");
      } else if (createResponse.status === 403) {
        throw new Error("Failed to create spreadsheet. Permission denied. Please check your Google Drive permissions.");
      } else if (createResponse.status === 429) {
        throw new Error("Failed to create spreadsheet. Too many requests. Please try later.");
      } else if (createResponse.status === 500) {
        throw new Error("Failed to create spreadsheet. Internal server error. Please try later.");
      } else if (createResponse.status === 502) {
        throw new Error("Failed to create spreadsheet. Bad gateway. Please try later.");
      } else if (createResponse.status === 503) {
        throw new Error("Failed to create spreadsheet. Service unavailable. Please try later.");
      } else if (createResponse.status === 504) {
        throw new Error("Failed to create spreadsheet. Gateway timeout. Please try later.");
      } else if (!createResponse.ok) {
        throw new Error("Failed to create spreadsheet");
      }

      const createResult = await createResponse.json();
      const newSpreadsheetId = createResult.spreadsheetId;
      const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}`;

      // Prepare the data
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
          "photo"

        ],
        ...filteredData.map((user) => [
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
          user.photo
        ]),
      ];

      // Update spreadsheet with data
      const updateResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${newSpreadsheetId}/values/Sheet1!A1:M${values.length}?valueInputOption=RAW`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ values }),
        }
      );

      if (updateResponse.status === 401) {
        throw new Error("Failed to update spreadsheet. Unauthorized. Please re-authenticate.");
      } else if (updateResponse.status === 403) {
        throw new Error("Failed to update spreadsheet. Forbidden. Please check your permissions.");
      } else if (updateResponse.status === 404) {
        throw new Error("Failed to update spreadsheet. Spreadsheet not found. Please try later.");
      } else if (updateResponse.status === 500) {
        throw new Error("Failed to update spreadsheet. Internal server error. Please try later.");
      } else if (updateResponse.status === 502) {
        throw new Error("Failed to update spreadsheet. Bad gateway. Please try later.");
      } else if (updateResponse.status === 503) {
        throw new Error("Failed to update spreadsheet. Service unavailable. Please try later.");
      } else if (updateResponse.status === 504) {
        throw new Error("Failed to update spreadsheet. Gateway timeout. Please try later.");
      } else if (!updateResponse.ok) {
        throw new Error("Failed to update spreadsheet");
      }

      // Close loading alert
      await loadingAlert.close();

      // Show success message with link
      await Swal.fire({
        title: "Success!",
        html: `
          Data has been exported to a new Google Sheet<br><br>
          <a href="${spreadsheetUrl}" target="_blank" class="">
          ${spreadsheetUrl}
          </a>
        `,
        icon: "success",
        confirmButtonText: "Close",
        showCloseButton: true,
      });
    } catch (error) {
      console.error("Export error:", error);
      Swal.close();

      await Swal.fire({
        title: "Export Failed",
        text: error.message || "An error occurred while exporting data",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const dataTableRef = useRef(null);

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
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/user_mock_data`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
  }, [token, tableConfig, filterFunction]);

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
        value={filterValues[id.replace("Filter", "")]}
        onChange={(e) => {
          const newValue = e.target.value;
          setFilterValues((prev) => ({
            ...prev,
            [id.replace("Filter", "")]: newValue,
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
                  onClick={handleExport}
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
            ></div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
