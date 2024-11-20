import image1 from "@/public/images/user/user-01.png";
import image2 from "@/public/images/user/user-02.png";
import { Testimonial } from "@/types/testimonial";

export const testimonialData: Testimonial[] = [
  {
    id: 1,
    name: "Anonymous Client",
    designation: "University Student",
    image: image1,
    content:
      "The essay writing service exceeded my expectations. They delivered a well-researched paper ahead of schedule and were very responsive to my requirements.",
  },
  {
    id: 2,
    name: "Anonymous Client",
    designation: "Graduate Student",
    image: image2,
    content:
      "I was impressed by the quality of work and attention to detail. The writer clearly understood the topic and provided excellent analysis with proper citations.",
  },
  {
    id: 3,
    name: "Anonymous Client",
    designation: "Undergraduate Student",
    image: image1,
    content:
      "Great experience working with this service. They helped me with my dissertation research and writing, delivering exceptional quality work that exceeded my expectations.",
  },
  {
    id: 4,
    name: "Anonymous Client",
    designation: "PhD Candidate",
    image: image2,
    content:
      "The research paper I received was thoroughly researched and well-structured. The writer's expertise in the subject matter was evident throughout the work.",
  },
];
