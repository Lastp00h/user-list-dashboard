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
import { FaFilter, FaSearch } from "react-icons/fa";

$.DataTable = DataTable;

const Dashboard = () => {
  const tableRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [userData, setUserData] = useState([]);
  const [showControls, setShowControls] = useState(false);
  const [sheetName, setSheetName] = useState("");

  const [filters, setFilters] = useState({
    
    genders: [],
    cities: [],
    countries: [],
    states: [],
    jobTitles: [],
    companyNames: [],
  });

  const dataTableRef = useRef(null);

  const API_URL =
    "https://script.google.com/macros/s/AKfycbxb5eNJaYJs2SN5itb-vJ7iPUfkzg14XlD8K2KRbgtRBYDybXhAUWT4hTFC-uARjjbo/exec";

  // Memoized table configuration
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
      dom: '<"datatables-header d-flex justify-content-end"f><"datatables-scroll"rt><"datatables-footer d-flex justify-content-between"ip>',
      pageLength: 10,
      deferRender: true,
      processing: true,
      searching: true,
      lengthChange: false,
      
      initComplete: function() {
        // Replace default search input with custom one
        const searchContainer = $(this).closest('.dataTables_wrapper').find('.dataTables_filter');
        searchContainer.empty().append(`
          <div class="d-flex align-items-center mb-3">
            <label class="d-flex align-items-center gap-2">
              <FaSearch class="text-secondary" />
              
              <input
                type="search"
                class="form-control form-control-sm"
                placeholder="Search id, first_name or ..."
                aria-controls="myTable"
                id="customSearch"

              />
            </label>
          </div>
        `);
        
        $('#customSearch').on('input', function() {
          dataTableRef.current.search(this.value).draw();
        });
        // Show controls after table is initialized
        setShowControls(true);
      }
    }),
    []
  );

  //Customize DataTables styles
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
      .dataTables_wrapper {
        position: relative;
        width: 100%;
        margin-bottom: 1rem;
        // border-radius: 8px; 
        // overflow: hidden; 
        // box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1); 
      }
      
      .datatables-header {
        position: sticky;
        left: 0;
        right: 0;
        background: white;
        z-index: 2;
        padding: 8px;
        border-bottom: 1px solid #dee2e6;
        // border-top-left-radius: 8px; 
        // border-top-right-radius: 8px; 
      }
      
      .datatables-footer {
        position: sticky;
        left: 0;
        right: 0;
        bottom: 0;
        background: white;
        z-index: 2;
        padding: 8px;
        border-top: 1px solid #dee2e6;
        border-bottom-left-radius: 8px; 
        border-bottom-right-radius: 8px; 
      }
      
      .datatables-scroll {
        overflow-x: auto;
        margin-bottom: 20px; 
      }
      
      .dataTables_filter {
        float: none;
        text-align: right;
        margin-bottom: 0;
      }
      
      .dataTables_filter input {
        margin-left: 0;
        width: 200px;
      }
      
      .table {
        margin-bottom: 0;
        width: 100% !important;
        
      }
      
      /* Ensure proper spacing for info and pagination */
      .dataTables_info {
        padding-top: 0;
        white-space: nowrap;
      }
      
      .dataTables_paginate {
        padding-top: 0;
        margin: 0;
        white-space: nowrap;
      }
      
      /* Make the table header sticky */
      .table thead th {
        position: sticky;
        top: 0;
        background: white;
        z-index: 1;
      }
    `;
    document.head.appendChild(styleSheet);
  
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);
  

  // Memoized filter function
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

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}?action=getUsers`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      setUserData(data);
       
      // Extract unique values for filters
      const newFilters = {
        genders: [...new Set(data.map((user) => user.gender || "None"))],
        cities: [...new Set(data.map((user) => user.city || "None"))],
        countries: [...new Set(data.map((user) => user.country || "None"))],
        states: [...new Set(data.map((user) => user.state || "None"))],
        jobTitles: [...new Set(data.map((user) => user.job_title || "None"))],
        companyNames: [
          ...new Set(data.map((user) => user.company_name || "None"))],
      };
      setFilters(newFilters);
  
      // Transform data for DataTable
      const tableData = data.map((user) => [
        user.id || "",
        user.first_name || "",
        user.last_name || "",
        user.email || "",
        user.gender || "",
        user.city || "",
        user.country || "",
        user.country_code || "",
        user.state || "",
        user.street_address || "",
        user.job_title || "",
        user.company_name || "",
        `<img src="${
          user.photo || ""
        }" alt="User Photo" style="width:50px;height:50px;loading:lazy"/>`,
      ]);
  
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }
  
      if (tableRef.current) {
        dataTableRef.current = $(tableRef.current).DataTable({
          ...tableConfig,
          data: tableData,
        });
  
        // Add custom filter
        $.fn.dataTable.ext.search.push(filterFunction);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [tableConfig, filterFunction]);

  const fetchName = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?action=getSheetName`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      setSheetName(data);
  
      // Extract the sheet name 
      const sheetName = data.sheetName || "Default Sheet Name";
      setSheetName(sheetName);
      // console.log("Sheet Name:", sheetName);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
    }
  }, []);

  useEffect(() => {
    fetchName();
  })

  // Fetch data when the component mounts
  useEffect(() => {
    fetchData();
    
    return () => {
      if (dataTableRef.current) {
        dataTableRef.current.destroy();
      }
    };
  }, [fetchData]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const filteredData = dataTableRef.current
        .rows({ filter: "applied" })
        .data()
        .toArray();

      const cleanData = filteredData.map((row) => {
        const cleanRow = [...row];
        const photoHtml = cleanRow.pop();
        const photoUrl = photoHtml.match(/src="([^"]+)"/)?.[1] || "";
        cleanRow.push(photoUrl);
        return cleanRow;
      });

      const headers = [
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
      ];

      const exportData = [headers, ...cleanData];
      const form = document.createElement("form");
      form.method = "POST";
      form.action = API_URL;
      form.target = "_blank";

      const formInputs = {
        action: "createSheet",
        data: JSON.stringify(exportData),
        sheetName: `Users Export ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}`,
      };

      Object.entries(formInputs).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      Swal.fire({
        icon: "success",
        title: "Export Successful",
        text: "The new spreadsheet will open in a new tab.",
      });
    } catch (error) {
      console.error("Export error:", error);
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: "Please try again in few seconds.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const FilterSelect = ({ id, label, options }) => (
    <div className="me-3 mb-3" style={{ display: "inline-block" }}>
      <label htmlFor={id} className="form-label d-block">
        {label}:
      </label>
      <select
        id={id}
        className="form-select"
        style={{ width: "auto", minWidth: "150px" }}
        onChange={() => dataTableRef.current.draw()}
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
    {/* Show loading spinner when data is loading */}
    {isLoading ? (
      null
    ) : (
      <>
        {/* Render the dashboard after data has loaded */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="mb-0">{sheetName}</h1>
          <div>
            {isExporting ? (
              <button className="btn btn-secondary" disabled>
                Exporting...
              </button>
            ) : (
              <button className="btn btn-success" onClick={handleExport}>
                Export to Google Sheets
              </button>
            )}
            <button
              className="btn btn-outline-secondary ms-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter className="me-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
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
              <FilterSelect id="cityFilter" label="City" options={filters.cities} />
              <FilterSelect
                id="countryFilter"
                label="Country"
                options={filters.countries}
              />
              <FilterSelect id="stateFilter" label="State" options={filters.states} />
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
      </>
    )}

      {isLoading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table ref={tableRef} className="table table-striped table-hover table-bordered cell-border rounded" id="myTable" />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
