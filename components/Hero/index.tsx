"use client";
import { Star, FileCheck, Check, User, Clock, Headphones } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const Hero = () => {
  return (
    <section className="pt-20 md:pt-24 lg:pt-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 grid md:grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
        <div className="space-y-6 md:space-y-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            A-Plus Homework Help
            <br />
            For All
          </h1>
          
          <div className="flex flex-wrap gap-3 md:gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-card rounded-full shadow-sm">
              <FileCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span className="text-xs md:text-sm text-foreground">AI free content</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-card rounded-full shadow-sm">
              <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span className="text-xs md:text-sm text-foreground">Plagiarism Free</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-card rounded-full shadow-sm">
              <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span className="text-xs md:text-sm text-foreground">Top Rated Writers</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-card rounded-full shadow-sm">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span className="text-xs md:text-sm text-foreground">20 day money back</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-card rounded-full shadow-sm">
              <FileCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span className="text-xs md:text-sm text-foreground">Complete Confidentiality</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-card rounded-full shadow-sm">
              <Headphones className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span className="text-xs md:text-sm text-foreground">24/7 Support</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 md:w-5 md:h-5 fill-warning text-warning" />
              <span className="font-semibold text-foreground">4.8</span>
              <span className="text-xs md:text-sm text-muted-foreground">Review Centre</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 md:w-5 md:h-5 fill-warning text-warning" />
              <span className="font-semibold text-foreground">4.7</span>
              <span className="text-xs md:text-sm text-muted-foreground">Sitejabber</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 md:w-5 md:h-5 fill-warning text-warning" />
              <span className="font-semibold text-foreground">4.7</span>
              <span className="text-xs md:text-sm text-muted-foreground">Reviews.io</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <Card className="relative z-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">Get Started</CardTitle>
              <CardDescription>Fill in the details to get help with your assignment</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4 md:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="assignment-type">Assignment Type</Label>
                  <Select>
                    <SelectTrigger id="assignment-type">
                      <SelectValue placeholder="Select type of assignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="research">Research Paper</SelectItem>
                      <SelectItem value="thesis">Thesis</SelectItem>
                      <SelectItem value="coursework">Coursework</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project-title">Project Title</Label>
                  <Input 
                    id="project-title"
                    placeholder="Enter your project title" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email" 
                    placeholder="Enter your email" 
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-warning hover:bg-warning/90 text-primary-foreground font-semibold"
                >
                  Get Help
                </Button>

                <div className="text-center text-xs md:text-sm text-muted-foreground">
                  Writers are ready to hire now
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Hero;
