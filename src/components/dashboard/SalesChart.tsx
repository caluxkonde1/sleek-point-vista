import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const hourlyData = [
  { time: '00', sales: 850 },
  { time: '02', sales: 1200 },
  { time: '04', sales: 950 },
  { time: '06', sales: 1600 },
  { time: '08', sales: 2100 },
  { time: '10', sales: 1800 },
  { time: '12', sales: 2800 },
  { time: '14', sales: 2400 },
  { time: '16', sales: 1900 },
  { time: '18', sales: 3200 },
  { time: '20', sales: 2900 },
  { time: '22', sales: 1500 }
];

const locationData = [
  { day: 'Mon 20', coffeeTalk: 400, lowNSlow: 720, coldNBrew: 680, tplusSpace: 800, sinergySpace: 290 },
  { day: 'Tue 21', coffeeTalk: 420, lowNSlow: 650, coldNBrew: 590, tplusSpace: 750, sinergySpace: 320 },
  { day: 'Wed 22', coffeeTalk: 380, lowNSlow: 580, coldNBrew: 620, tplusSpace: 700, sinergySpace: 280 },
  { day: 'Thu 23', coffeeTalk: 450, lowNSlow: 720, coldNBrew: 650, tplusSpace: 820, sinergySpace: 350 },
  { day: 'Fri 24', coffeeTalk: 390, lowNSlow: 680, coldNBrew: 590, tplusSpace: 780, sinergySpace: 310 },
  { day: 'Sat 25', coffeeTalk: 480, lowNSlow: 750, coldNBrew: 720, tplusSpace: 850, sinergySpace: 380 },
  { day: 'Sun 26', coffeeTalk: 520, lowNSlow: 780, coldNBrew: 750, tplusSpace: 880, sinergySpace: 400 },
  { day: 'Mon 27', coffeeTalk: 460, lowNSlow: 720, coldNBrew: 680, tplusSpace: 800, sinergySpace: 340 },
  { day: 'Tue 28', coffeeTalk: 440, lowNSlow: 690, coldNBrew: 640, tplusSpace: 770, sinergySpace: 320 }
];

export const HourlySalesChart = () => {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Hourly sales report</CardTitle>
        <div className="flex items-center gap-2">
          <Select defaultValue="country">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="country">Select Country</SelectItem>
              <SelectItem value="indonesia">Indonesia</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="city">
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="city">Cities</SelectItem>
              <SelectItem value="jakarta">Jakarta</SelectItem>
            </SelectContent>
          </Select>
          <button className="text-pos-orange text-sm font-medium hover:text-pos-orange/80">
            View All
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12, fill: '#666' }}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#666' }}
                axisLine={false}
                tickLine={false}
              />
              <Bar 
                dataKey="sales" 
                fill="hsl(221 83% 53%)" 
                radius={[4, 4, 0, 0]}
                className="transition-all hover:opacity-80"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export const LocationSalesChart = () => {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Selected location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Location Stats */}
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Coffeetalk</p>
              <p className="font-semibold">$1,432</p>
              <p className="text-xs text-muted-foreground">-3%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low n slow</p>
              <p className="font-semibold">$1,432</p>
              <p className="text-xs text-muted-foreground">3%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cold n brew</p>
              <p className="font-semibold">$1,432</p>
              <p className="text-xs text-muted-foreground">3%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">T plus space</p>
              <p className="font-semibold">$1,432</p>
              <p className="text-xs text-muted-foreground">-3%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sinergy space</p>
              <p className="font-semibold">$1,432</p>
              <p className="text-xs text-muted-foreground">-3%</p>
            </div>
          </div>

          {/* Line Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#666' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Line type="monotone" dataKey="coffeeTalk" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="lowNSlow" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="coldNBrew" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="tplusSpace" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="sinergySpace" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex justify-center">
            <div className="bg-card rounded-lg p-3 shadow-sm border">
              <div className="grid grid-cols-5 gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Coffeetalk: 40</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Low n slow: 72</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Cold n brew: 86</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>T plus space: 80</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Sinergy space: 29</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};