import {
  getIncomeByType,
  getMonthlyCollection,
  getOccupancy,
} from "@/lib/dashboard/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RentCollectionChart } from "./charts/rent-collection-chart";
import { IncomeTypeChart } from "./charts/income-type-chart";
import { OccupancyDonut } from "./charts/occupancy-donut";

const TYPE_LABELS: Record<string, string> = {
  FLAT: "Flat",
  OFFICE: "Office",
  LAND: "Land",
  RESORT: "Resort",
  SOCIETY: "Society",
};

export async function ChartsSection({ ownerId }: { ownerId: string }) {
  const [monthly, byType, occupancy] = await Promise.all([
    getMonthlyCollection(ownerId),
    getIncomeByType(ownerId),
    getOccupancy(ownerId),
  ]);

  const incomeData = byType.map((d) => ({
    type: TYPE_LABELS[d.type] ?? d.type,
    total: d.total,
  }));

  const donutData = [
    { name: "Occupied", value: occupancy.occupied },
    { name: "Vacant", value: occupancy.vacant },
    { name: "Maintenance", value: occupancy.maintenance },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Rent collection</CardTitle>
          <CardDescription>Collected per month over the last year</CardDescription>
        </CardHeader>
        <CardContent>
          <RentCollectionChart data={monthly} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Occupancy</CardTitle>
          <CardDescription>Property status mix</CardDescription>
        </CardHeader>
        <CardContent>
          <OccupancyDonut data={donutData} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Income by property type</CardTitle>
          <CardDescription>Total rent collected per type</CardDescription>
        </CardHeader>
        <CardContent>
          <IncomeTypeChart data={incomeData} />
        </CardContent>
      </Card>
    </div>
  );
}
