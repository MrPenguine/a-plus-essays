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
import { Badge } from "@/components/ui/badge";

const Hero = () => {
  return (
    <section className="pt-20 md:pt-24 lg:pt-28">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 grid md:grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
        <div className="space-y-6 md:space-y-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            A-Plus Homework Help
            <br />
            For All
          </h1>
          
          <div className="flex flex-wrap gap-3 md:gap-4">
            <div className="flex gap-2 py-1.5 px-4 rounded-full bg-secondary">
              <FileCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span>AI free content</span>
            </div>
            <div className="flex gap-2 py-1.5 px-4 rounded-full bg-secondary">
              <Check className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span>Plagiarism Free</span>
            </div>
            <div className="flex gap-2 py-1.5 px-4 rounded-full bg-secondary">
              <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span>Top Rated Writers</span>
            </div>
            <div className="flex gap-2 py-1.5 px-4 rounded-full bg-secondary">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span>20 day money back</span>
            </div>
            <div className="flex gap-2 py-1.5 px-4 rounded-full bg-secondary">
              <FileCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span>Complete Confidentiality</span>
            </div>
            <div className="flex gap-2 py-1.5 px-4 rounded-full bg-secondary">
              <Headphones className="w-3.5 h-3.5 md:w-4 md:h-4 text-success" />
              <span>24/7 Support</span>
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

        <div className="w-full lg:max-w-md lg:ml-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Fill in the details to get help with your assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
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

                <button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
                >
                  Get Help Now
                </button>

                <p className="text-center text-sm text-muted-foreground">
                  Writers are ready to help you now
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Hero;
