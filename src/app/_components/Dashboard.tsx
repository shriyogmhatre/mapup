"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { ScrollArea } from "~/components/ui/scroll-area";

const CSV_URL = "/Electric_Vehicle_Population_Data.csv";

interface Data {
  "VIN (1-10)": string;
  County: string;
  City: string;
  State: string;
  "Postal Code": number;
  "Model Year": number;
  Make: string;
  Model: string;
  "Electric Vehicle Type": string;
  "Clean Alternative Fuel Vehicle (CAFV) Eligibility": string;
  "Electric Range": number;
  "Base MSRP": number;
  "Legislative District": number;
  "DOL Vehicle ID": number;
  "Vehicle Location": string;
  "Electric Utility": string;
  "2020 Census Tract": number;
}

const ITEMS_PER_PAGE = 10;

export default function Dashboard() {
  const [data, setData] = useState<Data[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMake, setSelectedMake] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(CSV_URL);
        const csvText = await response.text();
        const result = Papa.parse<Data>(csvText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        });
        setData(result.data);
      } catch (err) {
        if (err instanceof Error) {
          console.error("Failed to load CSV data:", err.message);
        } else {
          console.error("An unknown error occurred");
        }
      }
    };

    void fetchData();
  }, []);

  const filteredData = data.filter((item) => {
    return (
      (selectedYear ? item["Model Year"] === selectedYear : true) &&
      (selectedMake ? item.Make === selectedMake : true)
    );
  });

  const totalVehicles = filteredData.length;
  const uniqueMakes = new Set(filteredData.map((item) => item.Make)).size;
  const averageRange =
    filteredData.reduce((sum, item) => sum + (item["Electric Range"] || 0), 0) /
    totalVehicles;

  const vehicleTypes = filteredData.reduce(
    (acc, item) => {
      const type = item["Electric Vehicle Type"] || "Unknown";
      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const vehicleTypesData = Object.entries(vehicleTypes).map(
    ([name, value]) => ({ name, value })
  );

  const makeDistribution = filteredData.reduce(
    (acc, item) => {
      const make = item.Make || "Unknown";
      acc[make] = (acc[make] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const makeDistributionData = Object.entries(makeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const rangeByYear = filteredData.reduce(
    (acc, item) => {
      const year = item["Model Year"];
      const range = item["Electric Range"];
      if (!isNaN(year) && !isNaN(range)) {
        if (!acc[year]) {
          acc[year] = { year, averageRange: 0, count: 0 };
        }
        acc[year].averageRange += range;
        acc[year].count += 1;
      }
      return acc;
    },
    {} as Record<number, { year: number; averageRange: number; count: number }>
  );

  const rangeByYearData = Object.values(rangeByYear)
    .map(({ year, averageRange, count }) => ({
      year,
      averageRange: averageRange / count,
    }))
    .sort((a, b) => a.year - b.year);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const uniqueYears = Array.from(
    new Set(data.map((item) => item["Model Year"]))
  );
  const uniqueMakesList = Array.from(new Set(data.map((item) => item.Make)));

  return (
    <div className="container mx-auto space-y-8 p-4">
      <h1 className="text-3xl font-bold text-white">
        Electric Vehicle Dashboard
      </h1>

      <div className="mb-4 flex gap-4">
        <Select
          onValueChange={(value) =>
            setSelectedYear(value ? Number(value) : null)
          }
        >
          <SelectTrigger className="rounded border px-4 py-2">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-years">All Years</SelectItem>
            {uniqueYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => setSelectedMake(value || null)}>
          <SelectTrigger className="rounded border px-4 py-2">
            <SelectValue placeholder="All Makes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-makes">All Makes</SelectItem>
            {uniqueMakesList.map((make) => (
              <SelectItem key={make} value={make}>
                {make}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalVehicles.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Makes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueMakes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Electric Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageRange.toFixed(2)} miles
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Types Distribution</CardTitle>
          </CardHeader>
          <ScrollArea>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehicleTypesData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
            </ScrollArea>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Vehicle Makes</CardTitle>
          </CardHeader>
          <ScrollArea>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={makeDistributionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius="80%"
                  label={(entry:{
                    name:string,
                    value:number
                  }) => entry.name}
                >
                  {makeDistributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`hsl(${index * 45}, 70%, 60%)`}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
            </ScrollArea>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Average Electric Range by Model Year</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rangeByYearData}>
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="averageRange" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Data</CardTitle>
          <CardDescription>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalVehicles)} of{" "}
            {totalVehicles} vehicles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VIN</TableHead>
                <TableHead>Make</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Electric Range</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item["VIN (1-10)"]}</TableCell>
                  <TableCell>{item.Make}</TableCell>
                  <TableCell>{item.Model}</TableCell>
                  <TableCell>{item["Model Year"]}</TableCell>
                  <TableCell>{item["Electric Range"]} miles</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-between">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, Math.ceil(totalVehicles / ITEMS_PER_PAGE)),
                )
              }
              disabled={
                currentPage === Math.ceil(totalVehicles / ITEMS_PER_PAGE)
              }
            >
              Next
              <ChevronRightIcon className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
