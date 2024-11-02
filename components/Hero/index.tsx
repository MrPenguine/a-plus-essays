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
    <section className="relative mt-[80px]">
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'var(--theme-image, url("/images/hero/hero-light.svg"))',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            opacity: '0.5',
          }}
        />
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      </div>
      

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 lg:py-16 grid md:grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
        <h1 className="block lg:hidden text-3xl lg:text-4xl xl:text-6xl font-bold text-foreground">
            A-Plus Homework Help For All
          </h1>
        <div className="w-full max-w-md mx-auto lg:ml-auto order-1 lg:order-2">
          <Card className="bg-card border shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl lg:text-2xl">Get Started</CardTitle>
              <CardDescription>
                Fill in the details to get help with your assignment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label>Assignment Type</Label>
                  <Select>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select type of assignment" />
                    </SelectTrigger>
                    <SelectContent className="bg-background">
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="research">Research Paper</SelectItem>
                      <SelectItem value="thesis">Thesis</SelectItem>
                      <SelectItem value="coursework">Coursework</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Project Title</Label>
                  <Input placeholder="Enter your project title" className="bg-background" />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="Enter your email" className="bg-background" />
                </div>

                <Button type="submit" className="w-full bg-primary text-primary-foreground">
                  Get Help Now
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Writers are ready to help you now
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:space-y-8 order-2 lg:order-1">
          <h1 className="hidden lg:block text-3xl lg:text-4xl xl:text-6xl font-bold">
            A-Plus Homework Help For All
          </h1>
          
          <div className="grid grid-cols-3 lg:flex lg:flex-wrap gap-2 lg:gap-4 text-xs lg:text-base">
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <FileCheck className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>AI free content</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <Check className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>Plagiarism Free</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <User className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>Top Writers</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <Clock className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>Money back</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <FileCheck className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>Confidential</span>
            </div>
            <div className="flex items-center gap-1.5 py-1.5 px-2 lg:py-2 lg:px-4 rounded-full bg-background/80 shadow-sm border">
              <Headphones className="w-3 h-3 lg:w-4 lg:h-4 text-success" />
              <span>24/7 Support</span>
            </div>
          </div>

          <div className="flex items-center justify-between lg:justify-start gap-2 lg:gap-6 bg-background/80 p-2 lg:p-4 rounded-lg shadow-sm border mt-4 lg:mt-0 text-xs lg:text-base">
            <div className="flex items-center gap-1 lg:gap-2">
              <Star className="w-4 h-4 lg:w-5 lg:h-5 fill-warning text-warning" />
              <span className="font-semibold">4.8</span>
              <span className="text-xs lg:text-sm text-muted-foreground">Review Centre</span>
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <Star className="w-4 h-4 lg:w-5 lg:h-5 fill-warning text-warning" />
              <span className="font-semibold">4.7</span>
              <span className="text-xs lg:text-sm text-muted-foreground">Sitejabber</span>
            </div>
            <div className="flex items-center gap-1 lg:gap-2">
              <Star className="w-4 h-4 lg:w-5 lg:h-5 fill-warning text-warning" />
              <span className="font-semibold">4.7</span>
              <span className="text-xs lg:text-sm text-muted-foreground">Reviews.io</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
