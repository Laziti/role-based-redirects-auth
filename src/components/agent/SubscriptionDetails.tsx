import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Crown, ListChecks, Calendar, DollarSign } from 'lucide-react';

interface SubscriptionDetailsProps {
  profile: {
    subscription_status: 'free' | 'pro';
    subscription_details: {
      plan_id: string;
      listings_per_month: number;
      duration: string;
      amount: number;
      start_date: string;
      end_date: string;
    } | null;
    listing_limit: {
      type: string;
      value: number;
      reset_date: string;
    } | null;
  };
}

const SubscriptionDetails = ({ profile }: SubscriptionDetailsProps) => {
  const isPro = profile.subscription_status === 'pro';
  const details = profile.subscription_details;
  const limit = profile.listing_limit;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Subscription Status</CardTitle>
            <CardDescription>Your current subscription plan and details</CardDescription>
          </div>
          <Badge variant={isPro ? "secondary" : "outline"} className="flex items-center gap-1">
            {isPro && <Crown className="h-4 w-4" />}
            {isPro ? 'PRO' : 'FREE'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isPro && details ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Monthly Listings</p>
                  <p className="text-2xl font-bold">{details.listings_per_month}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Subscription Cost</p>
                  <p className="text-2xl font-bold">${details.amount}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Valid until {format(new Date(details.end_date), 'MMMM d, yyyy')}
                </span>
              </div>
              
              {limit && (
                <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                  <h4 className="font-medium mb-2">Current Listing Allowance</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Resets on {format(new Date(limit.reset_date), 'MMMM d, yyyy')}
                    </span>
                    <Badge variant="outline">
                      {limit.value} remaining
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              You are currently on the free plan. Upgrade to Pro to access more features and increase your listing limit.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionDetails; 