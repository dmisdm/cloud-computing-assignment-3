package arxivism
import org.apache.hadoop.conf.*
import org.apache.hadoop.fs.FileSystem
import org.apache.hadoop.fs.Path
import org.apache.hadoop.io.*
import org.apache.hadoop.mapreduce.Job
import org.apache.hadoop.mapreduce.Mapper
import org.apache.hadoop.mapreduce.Reducer
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat
import org.apache.hadoop.mapreduce.lib.input.TextInputFormat
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat
import org.apache.hadoop.mapreduce.lib.output.TextOutputFormat
import java.io.IOException
import java.util.*

object WordCount {
    @Throws(Exception::class)
    @JvmStatic
    fun main(args: Array<String>) {
        val conf = Configuration()
        val job = Job.getInstance(conf, "wordcount")
        job.setJarByClass(WordCount::class.java)
        job.outputKeyClass = Text::class.java
        job.outputValueClass = IntWritable::class.java
        job.setMapperClass(Map::class.java)
        job.setReducerClass(Reduce::class.java)
        job.setInputFormatClass(TextInputFormat::class.java)
        job.setOutputFormatClass(TextOutputFormat::class.java)
        var outputDir = Path(args[2])
        FileInputFormat.addInputPath(job, Path(args[1]))
        FileOutputFormat.setOutputPath(job, outputDir)
        job.waitForCompletion(true)

    }

    class Map : Mapper<LongWritable, Text, Text?, IntWritable>() {
        private val word: Text = Text()
        @Throws(IOException::class, InterruptedException::class)
        public override fun map(key: LongWritable?, value: Text, context: Context) {
            val line: String = value.toString()
            val tokenizer = StringTokenizer(line)
            while (tokenizer.hasMoreTokens()) {
                word.set(tokenizer.nextToken())
                context.write(word, one)
            }
        }

        companion object {
            private val one: IntWritable = IntWritable(1)
        }
    }

    class Reduce : Reducer<Text, IntWritable, Text, IntWritable>() {
        @Throws(IOException::class, InterruptedException::class)
        public override fun reduce(key: Text?, values: Iterable<IntWritable>, context: Context) {
            var sum = 0
            for (`val` in values) {
                sum += `val`.get()
            }
            context.write(key, IntWritable(sum))
        }
    }
}